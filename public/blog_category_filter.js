// Digital Grandpa Blog Category Filtering
// Fixes 404 errors by implementing client-side filtering

document.addEventListener('DOMContentLoaded', function() {
    // Initialize category filtering
    initializeCategoryFiltering();
});

function initializeCategoryFiltering() {
    // Get all category links
    const categoryLinks = document.querySelectorAll('.category-list a');
    
    // Convert category links to filter buttons
    categoryLinks.forEach(link => {
        // Extract category from href
        const href = link.getAttribute('href');
        const categoryMatch = href.match(/\/blog\/category\/(.+)\.html/);
        
        if (categoryMatch) {
            const category = categoryMatch[1];
            
            // Prevent default link behavior
            link.addEventListener('click', function(e) {
                e.preventDefault();
                filterBlogPosts(category);
                updateActiveCategory(link);
            });
            
            // Store category data
            link.setAttribute('data-category', category);
        }
    });
    
    // Add "All Posts" option
    addAllPostsOption();
}

function filterBlogPosts(category) {
    const blogPosts = document.querySelectorAll('.blog-post');
    
    blogPosts.forEach(post => {
        const postCategory = post.getAttribute('data-category');
        
        if (category === 'all' || postCategory === category) {
            // Show post with fade in effect
            post.style.display = 'block';
            post.style.opacity = '0';
            setTimeout(() => {
                post.style.opacity = '1';
            }, 50);
        } else {
            // Hide post with fade out effect
            post.style.opacity = '0';
            setTimeout(() => {
                post.style.display = 'none';
            }, 300);
        }
    });
    
    // Update page title
    updatePageTitle(category);
    
    // Update URL without page reload (optional)
    updateURL(category);
}

function updateActiveCategory(activeLink) {
    // Remove active class from all category links
    const categoryLinks = document.querySelectorAll('.category-list a');
    categoryLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    activeLink.classList.add('active');
}

function addAllPostsOption() {
    const categoryList = document.querySelector('.category-list');
    
    if (categoryList) {
        // Create "All Posts" option
        const allPostsItem = document.createElement('li');
        const allPostsLink = document.createElement('a');
        
        allPostsLink.href = '#';
        allPostsLink.innerHTML = 'All Posts <span class="category-count">All</span>';
        allPostsLink.classList.add('active'); // Default active
        
        allPostsLink.addEventListener('click', function(e) {
            e.preventDefault();
            filterBlogPosts('all');
            updateActiveCategory(allPostsLink);
        });
        
        allPostsItem.appendChild(allPostsLink);
        
        // Insert at the beginning of the list
        categoryList.insertBefore(allPostsItem, categoryList.firstChild);
    }
}

function updatePageTitle(category) {
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    
    if (pageTitle) {
        if (category === 'all') {
            pageTitle.textContent = 'Digital Grandpa Blog';
            if (pageSubtitle) {
                pageSubtitle.textContent = 'Real stories, practical wisdom, and proven strategies for transforming setbacks into comebacks. Written by someone who\'s been there and found a way forward.';
            }
        } else {
            const categoryName = formatCategoryName(category);
            pageTitle.textContent = `${categoryName} - Digital Grandpa Blog`;
            if (pageSubtitle) {
                pageSubtitle.textContent = `Posts about ${categoryName.toLowerCase()} from Digital Grandpa.`;
            }
        }
    }
}

function formatCategoryName(category) {
    const categoryMap = {
        'veterans': 'Veterans',
        'resilience': 'Resilience',
        'formerly-incarcerated': 'Formerly Incarcerated',
        'at-risk-youth': 'At-Risk Youth',
        'ai-technology': 'AI & Technology',
        'personal-stories': 'Personal Stories',
        'practical-advice': 'Practical Advice'
    };
    
    return categoryMap[category] || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function updateURL(category) {
    // Update URL without page reload (optional feature)
    if (history.pushState) {
        const newURL = category === 'all' ? '/blog.html' : `/blog.html#category-${category}`;
        history.pushState({ category: category }, '', newURL);
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.category) {
        filterBlogPosts(event.state.category);
        
        // Update active category link
        const categoryLink = document.querySelector(`[data-category="${event.state.category}"]`);
        if (categoryLink) {
            updateActiveCategory(categoryLink);
        }
    }
});

// CSS for smooth transitions
const style = document.createElement('style');
style.textContent = `
    .blog-post {
        transition: opacity 0.3s ease;
    }
    
    .category-list a {
        transition: all 0.3s ease;
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .category-list a:hover {
        background-color: var(--cream-white);
        color: var(--navy-blue);
    }
    
    .category-list a.active {
        background-color: var(--deep-gold);
        color: var(--navy-blue);
        font-weight: 600;
    }
    
    .category-count {
        float: right;
        font-size: 0.9em;
        opacity: 0.7;
    }
`;
document.head.appendChild(style);

