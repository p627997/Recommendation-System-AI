"""
Hybrid Recommendation Engine using Faiss + TF-IDF

This engine combines:
1. Content-based filtering: TF-IDF vectors of blog content + Faiss similarity search
2. Collaborative filtering: User-item interaction embeddings + Faiss search
3. Hybrid: Weighted combination of both approaches
"""

import numpy as np
import faiss
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize
from django.db.models import Avg, Count
from django.conf import settings
import os
import pickle


class HybridRecommendationEngine:
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,  # Limit features for memory efficiency
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.content_index = None
        self.collab_index = None
        self.blog_ids = []
        self.user_ids = []
        self.blog_vectors = None
        self.user_vectors = None
        self.index_path = os.path.join(settings.BASE_DIR, 'recommendation_index')

    def _prepare_blog_content(self, blogs):
        """Combine blog title, content, tags, and category for TF-IDF."""
        contents = []
        for blog in blogs:
            tags = ' '.join([tag.name for tag in blog.tags.all()])
            category = blog.category.name if blog.category else ''
            combined = f"{blog.title} {blog.title} {category} {tags} {blog.content}"
            contents.append(combined)
        return contents

    def build_content_index(self, blogs):
        """Build Faiss index from blog content using TF-IDF vectors."""
        if not blogs:
            return

        self.blog_ids = [blog.id for blog in blogs]
        contents = self._prepare_blog_content(blogs)

        # Create TF-IDF vectors
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(contents)
        self.blog_vectors = normalize(tfidf_matrix.toarray()).astype('float32')

        # Build Faiss index (using L2 distance on normalized vectors = cosine similarity)
        dimension = self.blog_vectors.shape[1]
        self.content_index = faiss.IndexFlatIP(dimension)  # Inner product for cosine sim
        self.content_index.add(self.blog_vectors)

    def build_collaborative_index(self, interactions):
        """
        Build collaborative filtering index using user-item interaction matrix.
        Uses matrix factorization approach with SVD.
        """
        from blog.models import Blog
        from django.contrib.auth import get_user_model

        User = get_user_model()

        if not interactions:
            return

        # Get unique users and blogs
        users = list(User.objects.filter(interactions__isnull=False).distinct())
        blogs = list(Blog.objects.filter(status='published'))

        if not users or not blogs:
            return

        self.user_ids = [u.id for u in users]
        blog_id_to_idx = {b.id: idx for idx, b in enumerate(blogs)}
        user_id_to_idx = {u.id: idx for idx, u in enumerate(users)}

        # Create user-item matrix
        n_users = len(users)
        n_items = len(blogs)
        interaction_matrix = np.zeros((n_users, n_items), dtype='float32')

        for interaction in interactions:
            if interaction.user_id in user_id_to_idx and interaction.blog_id in blog_id_to_idx:
                u_idx = user_id_to_idx[interaction.user_id]
                i_idx = blog_id_to_idx[interaction.blog_id]
                interaction_matrix[u_idx, i_idx] = max(
                    interaction_matrix[u_idx, i_idx],
                    interaction.rating
                )

        # Simple SVD for dimensionality reduction
        from scipy.sparse.linalg import svds
        from scipy.sparse import csr_matrix

        sparse_matrix = csr_matrix(interaction_matrix)
        k = min(50, min(n_users, n_items) - 1)  # Number of latent factors

        if k < 1:
            return

        try:
            U, sigma, Vt = svds(sparse_matrix, k=k)
            # User embeddings
            self.user_vectors = normalize(U * sigma).astype('float32')
            # Item embeddings (for finding similar items)
            item_vectors = normalize(Vt.T).astype('float32')

            # Build index for item similarity
            dimension = item_vectors.shape[1]
            self.collab_index = faiss.IndexFlatIP(dimension)
            self.collab_index.add(item_vectors)
        except Exception:
            # Fallback if SVD fails (e.g., not enough data)
            pass

    def get_content_recommendations(self, blog_id, n_recommendations=10):
        """Get similar blogs based on content."""
        if self.content_index is None or blog_id not in self.blog_ids:
            return []

        idx = self.blog_ids.index(blog_id)
        query_vector = self.blog_vectors[idx:idx+1]

        # Search for similar blogs
        distances, indices = self.content_index.search(query_vector, n_recommendations + 1)

        # Exclude the query blog itself
        recommendations = []
        for i, dist in zip(indices[0], distances[0]):
            if self.blog_ids[i] != blog_id:
                recommendations.append({
                    'blog_id': self.blog_ids[i],
                    'score': float(dist),
                    'type': 'content'
                })

        return recommendations[:n_recommendations]

    def get_collaborative_recommendations(self, user_id, n_recommendations=10):
        """Get recommendations based on user's interaction history."""
        from .models import UserInteraction

        if self.collab_index is None or not self.user_ids:
            return []

        if user_id not in self.user_ids:
            # Cold start - return popular items
            return self._get_popular_blogs(n_recommendations)

        # Get user's interacted blogs to exclude
        interacted_blogs = set(
            UserInteraction.objects.filter(user_id=user_id)
            .values_list('blog_id', flat=True)
        )

        u_idx = self.user_ids.index(user_id)
        user_vector = self.user_vectors[u_idx:u_idx+1]

        # Search for similar items based on user preference
        distances, indices = self.collab_index.search(user_vector, n_recommendations * 2)

        recommendations = []
        for i, dist in zip(indices[0], distances[0]):
            if i < len(self.blog_ids):
                blog_id = self.blog_ids[i]
                if blog_id not in interacted_blogs:
                    recommendations.append({
                        'blog_id': blog_id,
                        'score': float(dist),
                        'type': 'collaborative'
                    })

        return recommendations[:n_recommendations]

    def get_hybrid_recommendations(self, user_id=None, blog_id=None, n_recommendations=10,
                                    content_weight=0.5, collab_weight=0.5):
        """
        Get hybrid recommendations combining content and collaborative filtering.

        Args:
            user_id: Current user (for collaborative filtering)
            blog_id: Current blog being viewed (for content-based)
            n_recommendations: Number of recommendations to return
            content_weight: Weight for content-based scores (0-1)
            collab_weight: Weight for collaborative scores (0-1)
        """
        recommendations = {}

        # Get content-based recommendations
        if blog_id and self.content_index:
            content_recs = self.get_content_recommendations(blog_id, n_recommendations * 2)
            for rec in content_recs:
                recommendations[rec['blog_id']] = {
                    'content_score': rec['score'] * content_weight,
                    'collab_score': 0,
                    'blog_id': rec['blog_id']
                }

        # Get collaborative recommendations
        if user_id and self.collab_index:
            collab_recs = self.get_collaborative_recommendations(user_id, n_recommendations * 2)
            for rec in collab_recs:
                if rec['blog_id'] in recommendations:
                    recommendations[rec['blog_id']]['collab_score'] = rec['score'] * collab_weight
                else:
                    recommendations[rec['blog_id']] = {
                        'content_score': 0,
                        'collab_score': rec['score'] * collab_weight,
                        'blog_id': rec['blog_id']
                    }

        # Calculate combined scores
        final_recs = []
        for blog_id, scores in recommendations.items():
            final_recs.append({
                'blog_id': scores['blog_id'],
                'score': scores['content_score'] + scores['collab_score'],
                'content_score': scores['content_score'],
                'collab_score': scores['collab_score']
            })

        # Sort by combined score
        final_recs.sort(key=lambda x: x['score'], reverse=True)

        return final_recs[:n_recommendations]

    def _get_popular_blogs(self, n):
        """Fallback: Get popular blogs for cold start users."""
        from blog.models import Blog

        popular = Blog.objects.filter(status='published').annotate(
            engagement=Count('likes') + Count('comments') + Count('bookmarks')
        ).order_by('-engagement', '-views_count')[:n]

        return [{
            'blog_id': blog.id,
            'score': 1.0,
            'type': 'popular'
        } for blog in popular]

    def save_index(self):
        """Save the indices to disk."""
        os.makedirs(self.index_path, exist_ok=True)

        if self.content_index:
            faiss.write_index(
                self.content_index,
                os.path.join(self.index_path, 'content.index')
            )

        if self.collab_index:
            faiss.write_index(
                self.collab_index,
                os.path.join(self.index_path, 'collab.index')
            )

        # Save metadata
        metadata = {
            'blog_ids': self.blog_ids,
            'user_ids': self.user_ids,
            'blog_vectors': self.blog_vectors,
            'user_vectors': self.user_vectors,
        }
        with open(os.path.join(self.index_path, 'metadata.pkl'), 'wb') as f:
            pickle.dump(metadata, f)

        # Save vectorizer
        with open(os.path.join(self.index_path, 'vectorizer.pkl'), 'wb') as f:
            pickle.dump(self.tfidf_vectorizer, f)

    def load_index(self):
        """Load indices from disk."""
        try:
            content_path = os.path.join(self.index_path, 'content.index')
            collab_path = os.path.join(self.index_path, 'collab.index')
            metadata_path = os.path.join(self.index_path, 'metadata.pkl')
            vectorizer_path = os.path.join(self.index_path, 'vectorizer.pkl')

            if os.path.exists(content_path):
                self.content_index = faiss.read_index(content_path)

            if os.path.exists(collab_path):
                self.collab_index = faiss.read_index(collab_path)

            if os.path.exists(metadata_path):
                with open(metadata_path, 'rb') as f:
                    metadata = pickle.load(f)
                    self.blog_ids = metadata['blog_ids']
                    self.user_ids = metadata['user_ids']
                    self.blog_vectors = metadata['blog_vectors']
                    self.user_vectors = metadata['user_vectors']

            if os.path.exists(vectorizer_path):
                with open(vectorizer_path, 'rb') as f:
                    self.tfidf_vectorizer = pickle.load(f)

            return True
        except Exception:
            return False

    def rebuild_indices(self):
        """Rebuild all indices from current database state."""
        from blog.models import Blog
        from .models import UserInteraction

        blogs = list(Blog.objects.filter(status='published').prefetch_related('tags', 'category'))
        interactions = list(UserInteraction.objects.all())

        self.build_content_index(blogs)
        self.build_collaborative_index(interactions)
        self.save_index()


# Singleton instance
_engine_instance = None


def get_recommendation_engine():
    """Get or create the recommendation engine singleton."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = HybridRecommendationEngine()
        _engine_instance.load_index()
    return _engine_instance
