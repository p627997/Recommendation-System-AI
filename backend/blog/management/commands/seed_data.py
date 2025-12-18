from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from blog.models import Category, Tag, Blog, Like, Comment
from recommendations.models import UserInteraction
from recommendations.engine import get_recommendation_engine
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample blog data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create categories
        categories_data = [
            ('Technology', 'Latest in tech, programming, and software development'),
            ('Travel', 'Travel guides, tips, and destination reviews'),
            ('Food', 'Recipes, restaurant reviews, and cooking tips'),
            ('Lifestyle', 'Health, wellness, and personal development'),
            ('Business', 'Entrepreneurship, marketing, and career advice'),
            ('Science', 'Scientific discoveries and research'),
        ]

        categories = []
        for name, desc in categories_data:
            cat, _ = Category.objects.get_or_create(name=name, defaults={'description': desc})
            categories.append(cat)
            self.stdout.write(f'  Category: {name}')

        # Create tags
        tags_data = [
            'python', 'javascript', 'react', 'django', 'machine-learning',
            'ai', 'web-development', 'mobile', 'cloud', 'devops',
            'travel-tips', 'budget-travel', 'food-review', 'recipes',
            'health', 'fitness', 'productivity', 'startup', 'marketing'
        ]

        tags = []
        for name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)

        self.stdout.write(f'  Created {len(tags)} tags')

        # Create users
        users = []
        for i in range(5):
            username = f'blogger{i+1}'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@example.com',
                    'bio': f'I am blogger {i+1}, passionate about writing!'
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            users.append(user)

        self.stdout.write(f'  Created {len(users)} users')

        # Sample blog content
        blogs_data = [
            {
                'title': 'Getting Started with Python Machine Learning',
                'content': '''Machine learning has become an essential skill for modern developers. In this comprehensive guide, we'll explore how to get started with machine learning using Python.

Python offers several powerful libraries for machine learning, including scikit-learn, TensorFlow, and PyTorch. Each has its strengths and use cases.

Scikit-learn is perfect for beginners as it provides simple and efficient tools for predictive data analysis. It's built on NumPy, SciPy, and matplotlib, making it a great choice for classical machine learning algorithms.

TensorFlow, developed by Google, is excellent for deep learning applications. It provides both high-level APIs like Keras and low-level APIs for custom model building.

PyTorch, maintained by Facebook's AI Research lab, has gained popularity for its dynamic computational graphs and ease of debugging.

To get started, I recommend beginning with scikit-learn for understanding the fundamentals, then moving to TensorFlow or PyTorch for deep learning projects.

Remember, the key to mastering machine learning is practice. Start with simple datasets, understand the algorithms, and gradually tackle more complex problems.''',
                'category': 'Technology',
                'tags': ['python', 'machine-learning', 'ai']
            },
            {
                'title': 'Building Modern Web Apps with React and Django',
                'content': '''Combining React for the frontend and Django for the backend creates a powerful stack for building modern web applications.

React provides a component-based architecture that makes building interactive UIs a breeze. Its virtual DOM ensures efficient updates, and the extensive ecosystem offers solutions for routing, state management, and more.

Django, the "web framework for perfectionists with deadlines," excels at rapid development while maintaining clean, pragmatic design. Django REST Framework extends Django to create powerful APIs.

The combination works beautifully: Django handles data models, authentication, and business logic, while React creates smooth, responsive user interfaces.

Key integration points include:
- CORS configuration for cross-origin requests
- Token-based authentication for API security
- Proper API versioning for maintainability

This architecture scales well and separates concerns effectively, making it ideal for teams where frontend and backend developers work independently.''',
                'category': 'Technology',
                'tags': ['react', 'django', 'web-development', 'python', 'javascript']
            },
            {
                'title': 'Hidden Gems: Budget Travel in Southeast Asia',
                'content': '''Southeast Asia remains one of the best regions for budget travelers. Beyond the tourist hotspots, countless hidden gems await discovery.

In Vietnam, skip the crowded Halong Bay tours and explore Ninh Binh instead. Known as "Halong Bay on land," it offers stunning limestone karsts, ancient temples, and a fraction of the crowds.

Thailand's northeast region, Isaan, provides authentic experiences away from the tourist trail. The food is incredible, prices are local, and you'll likely be the only tourist in many places.

The Philippines' Siargao island is a surfer's paradise but also offers beautiful lagoons, mangrove forests, and some of the friendliest locals you'll meet.

Budget tips:
- Travel in shoulder season (March-May or September-November)
- Use local transportation
- Eat at local markets and street food stalls
- Stay in locally-owned guesthouses
- Learn a few local phrases - it opens doors everywhere

With $30-50 per day, you can travel comfortably through most of Southeast Asia, experiencing incredible cultures and landscapes.''',
                'category': 'Travel',
                'tags': ['travel-tips', 'budget-travel']
            },
            {
                'title': 'The Art of Making Perfect Sourdough Bread',
                'content': '''Sourdough bread has experienced a renaissance, and for good reason. The complex flavors, chewy texture, and the satisfaction of working with a living culture make it special.

Creating your starter is the first step. Mix equal parts flour and water, and feed it daily. Within 1-2 weeks, you'll have a bubbly, active starter ready for baking.

The key to great sourdough is patience and observation. Unlike commercial yeast, sourdough fermentation depends on temperature, hydration, and the health of your starter.

My basic recipe:
- 500g bread flour
- 350g water
- 100g active starter
- 10g salt

Mix everything except salt, rest for 30 minutes (autolyse), add salt and perform stretch and folds every 30 minutes for 2 hours. Bulk ferment until doubled, shape, and cold proof overnight.

Bake in a preheated Dutch oven at 250°C for 20 minutes covered, then 20 minutes uncovered.

The learning curve is real, but each loaf teaches you something. Accept that your early attempts might not be perfect - that's part of the journey.''',
                'category': 'Food',
                'tags': ['recipes', 'food-review']
            },
            {
                'title': 'Morning Routines That Actually Work',
                'content': '''After experimenting with countless morning routines, I've found what actually makes a difference versus what's just performative.

The fundamentals are simple:
1. Consistent wake time (even weekends)
2. No phone for the first hour
3. Hydration before caffeine
4. Some form of movement

That's it. You don't need a 2-hour routine with ice baths, journaling, meditation, and gratitude practices. Start with these four basics and add elements only if they genuinely improve your day.

The no-phone rule is transformative. Instead of starting the day reactive (responding to emails, checking social media), you start proactive. Use that time for what matters to you.

Morning movement doesn't mean an intense workout. A 10-minute walk, some stretches, or a few yoga poses are enough to wake your body and mind.

The key insight: consistency beats intensity. A simple routine you do every day beats an elaborate one you abandon after a week.''',
                'category': 'Lifestyle',
                'tags': ['health', 'fitness', 'productivity']
            },
            {
                'title': 'From Side Project to Startup: Lessons Learned',
                'content': '''Two years ago, I launched a weekend project. Today, it's a company with paying customers and a small team. Here's what I learned.

Start with your own problem. The best side projects solve issues you personally experience. You understand the problem deeply, and you're your own first customer.

Launch early, embarrassingly early. My first version was held together with duct tape and hope. But it worked well enough for users to try it, provide feedback, and validate the concept.

Charge from day one. Free users give different feedback than paying customers. The moment someone pays, you know you're solving a real problem worth solving.

Growth came from focus. We said no to 90% of feature requests. Instead, we did a few things exceptionally well. Users appreciate depth over breadth.

Building in public helped enormously. Sharing our journey on social media built an audience before we had a product worth promoting.

The hardest part isn't building - it's the emotional roller coaster. Some days you feel unstoppable; others, you question everything. Both feelings are normal.''',
                'category': 'Business',
                'tags': ['startup', 'marketing', 'productivity']
            },
            {
                'title': 'Understanding CRISPR: Gene Editing Explained',
                'content': '''CRISPR-Cas9 has revolutionized genetic engineering, making gene editing faster, cheaper, and more precise than ever before. But how does it actually work?

CRISPR stands for Clustered Regularly Interspaced Short Palindromic Repeats. It's a natural defense mechanism bacteria use against viruses. Scientists adapted this system for precise genetic modifications.

Think of it as molecular scissors. The guide RNA directs the Cas9 protein to a specific location in the DNA, where it makes a cut. The cell's natural repair mechanisms then kick in, and scientists can use this to insert, delete, or modify genes.

Applications are vast:
- Treating genetic diseases like sickle cell anemia
- Creating disease-resistant crops
- Developing new antibiotics
- Potentially eliminating hereditary conditions

Ethical considerations are significant. Germline editing (changes passed to future generations) raises questions about designer babies and unforeseen consequences.

The technology advances rapidly. Base editing and prime editing offer even more precision. Within our lifetime, we may see genetic diseases becoming historical footnotes.''',
                'category': 'Science',
                'tags': ['ai', 'machine-learning']
            },
            {
                'title': 'DevOps Best Practices for Small Teams',
                'content': '''You don't need a dedicated DevOps team to implement good practices. Small teams can achieve automation, reliability, and fast deployments with the right approach.

Start with CI/CD. GitHub Actions or GitLab CI are free for small teams and straightforward to set up. Automate your tests and deployments - manual processes don't scale.

Infrastructure as Code (IaC) is essential. Whether you use Terraform, Pulumi, or cloud-native tools, define your infrastructure in code. It's version-controlled, reproducible, and self-documenting.

Containerization with Docker simplifies environment consistency. "It works on my machine" becomes a thing of the past when everyone runs identical containers.

Monitoring and observability prevent surprises. Set up alerts for key metrics, implement logging, and use APM tools to understand your system's behavior.

Keep it simple. Don't over-engineer. Kubernetes is powerful but might be overkill for your scale. A simple deployment pipeline to a PaaS often serves small teams better.

Documentation matters. Document your setup, runbooks for common issues, and architecture decisions. Future you (and teammates) will be grateful.''',
                'category': 'Technology',
                'tags': ['devops', 'cloud', 'web-development']
            },
        ]

        # Create blogs with some randomization
        created_blogs = []
        for blog_data in blogs_data:
            cat = Category.objects.get(name=blog_data['category'])
            author = random.choice(users)

            blog, created = Blog.objects.get_or_create(
                title=blog_data['title'],
                defaults={
                    'content': blog_data['content'],
                    'category': cat,
                    'author': author,
                    'status': 'published',
                    'published_at': timezone.now(),
                    'views_count': random.randint(10, 500)
                }
            )

            if created:
                # Add tags
                blog_tags = Tag.objects.filter(name__in=blog_data['tags'])
                blog.tags.set(blog_tags)

            created_blogs.append(blog)
            self.stdout.write(f'  Blog: {blog.title}')

        # Create some interactions (likes, comments)
        for blog in created_blogs:
            # Random likes
            for user in random.sample(users, k=random.randint(1, len(users))):
                Like.objects.get_or_create(blog=blog, user=user)
                UserInteraction.objects.get_or_create(
                    user=user,
                    blog=blog,
                    interaction_type='like',
                    defaults={'rating': 4.0}
                )

            # Random comments
            sample_comments = [
                "Great article! Very informative.",
                "Thanks for sharing this!",
                "I learned something new today.",
                "Well written and easy to understand.",
                "Looking forward to more content like this!",
            ]
            for _ in range(random.randint(0, 3)):
                user = random.choice(users)
                Comment.objects.create(
                    blog=blog,
                    author=user,
                    content=random.choice(sample_comments)
                )
                UserInteraction.objects.get_or_create(
                    user=user,
                    blog=blog,
                    interaction_type='comment',
                    defaults={'rating': 3.0}
                )

        # Build recommendation index
        self.stdout.write('Building recommendation index...')
        engine = get_recommendation_engine()
        engine.rebuild_indices()

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write(f'  Categories: {Category.objects.count()}')
        self.stdout.write(f'  Tags: {Tag.objects.count()}')
        self.stdout.write(f'  Users: {User.objects.count()}')
        self.stdout.write(f'  Blogs: {Blog.objects.count()}')
        self.stdout.write(f'  Comments: {Comment.objects.count()}')
        self.stdout.write(f'  Likes: {Like.objects.count()}')
