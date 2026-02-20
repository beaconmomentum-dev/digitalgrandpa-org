#!/usr/bin/env python3
"""
Digital Grandpa Blog Manager
Simple system for managing blog posts and generating HTML from Markdown
"""

import os
import json
import markdown
from datetime import datetime
import re

class BlogManager:
    def __init__(self, blog_dir="blog", posts_dir="posts", templates_dir="templates"):
        self.blog_dir = blog_dir
        self.posts_dir = posts_dir
        self.templates_dir = templates_dir
        self.posts_index_file = "posts_index.json"
        
        # Create directories if they don't exist
        os.makedirs(self.blog_dir, exist_ok=True)
        os.makedirs(self.posts_dir, exist_ok=True)
        os.makedirs(self.templates_dir, exist_ok=True)
        
    def create_post_template(self, title, category, author="Bob", excerpt=""):
        """Create a new Markdown post template"""
        slug = self.title_to_slug(title)
        date = datetime.now().strftime("%Y-%m-%d")
        
        template = f"""---
title: {title}
category: {category}
author: {author}
date: {date}
excerpt: {excerpt}
slug: {slug}
published: false
---

# {title}

Write your blog post content here using Markdown syntax.

## Section Heading

Your content goes here...

### Subsection

More content...

> This is a blockquote for important callouts.

- Bullet point 1
- Bullet point 2
- Bullet point 3

**Bold text** and *italic text* for emphasis.

[Link text](https://example.com)

---

## Conclusion

Wrap up your post here.
"""
        
        filename = f"{date}-{slug}.md"
        filepath = os.path.join(self.posts_dir, filename)
        
        with open(filepath, 'w') as f:
            f.write(template)
            
        print(f"Created post template: {filepath}")
        return filepath
    
    def title_to_slug(self, title):
        """Convert title to URL-friendly slug"""
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = slug.strip('-')
        return slug
    
    def parse_post_metadata(self, content):
        """Parse frontmatter metadata from post content"""
        if not content.startswith('---'):
            return {}, content
            
        parts = content.split('---', 2)
        if len(parts) < 3:
            return {}, content
            
        metadata_text = parts[1].strip()
        content_text = parts[2].strip()
        
        metadata = {}
        for line in metadata_text.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                metadata[key.strip()] = value.strip()
                
        return metadata, content_text
    
    def markdown_to_html(self, markdown_content, metadata):
        """Convert Markdown content to HTML with template"""
        md = markdown.Markdown(extensions=['extra', 'codehilite'])
        html_content = md.convert(markdown_content)
        
        # Load HTML template
        template_path = os.path.join(self.templates_dir, "blog_post_template.html")
        if os.path.exists(template_path):
            with open(template_path, 'r') as f:
                template = f.read()
        else:
            template = self.get_default_template()
            
        # Replace template variables
        html = template.replace('{{TITLE}}', metadata.get('title', 'Untitled'))
        html = html.replace('{{CATEGORY}}', metadata.get('category', 'General'))
        html = html.replace('{{AUTHOR}}', metadata.get('author', 'Bob'))
        html = html.replace('{{DATE}}', metadata.get('date', ''))
        html = html.replace('{{CONTENT}}', html_content)
        html = html.replace('{{EXCERPT}}', metadata.get('excerpt', ''))
        html = html.replace('{{SLUG}}', metadata.get('slug', ''))
        
        return html
    
    def get_default_template(self):
        """Return default blog post HTML template"""
        return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{EXCERPT}}">
    <title>{{TITLE}} - Digital Grandpa</title>
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-brand">Digital Grandpa</a>
            <div class="nav-menu">
                <a href="/" class="nav-link">Home</a>
                <a href="/about.html" class="nav-link">About</a>
                <a href="/store.html" class="nav-link">Store</a>
                <a href="/blog.html" class="nav-link active">Blog</a>
                <a href="/contact.html" class="nav-link">Contact</a>
                <a href="https://joinriseandreclaim.com" class="nav-link rise-cta" target="_blank">Rise & Reclaim</a>
            </div>
        </div>
    </nav>

    <main class="article-content">
        <div class="back-to-blog">
            <a href="/blog.html">← Back to Blog</a>
        </div>
        
        <div class="article-meta">
            <span class="article-category">{{CATEGORY}}</span>
            <span>{{DATE}}</span>
            <span>By {{AUTHOR}}</span>
        </div>
        
        {{CONTENT}}
        
        <div class="back-to-blog">
            <a href="/blog.html">← Back to Blog</a>
        </div>
    </main>
    
    <script src="../script.js"></script>
</body>
</html>'''
    
    def publish_post(self, markdown_file):
        """Convert Markdown post to HTML and publish"""
        with open(markdown_file, 'r') as f:
            content = f.read()
            
        metadata, markdown_content = self.parse_post_metadata(content)
        
        if metadata.get('published', 'false').lower() != 'true':
            print(f"Post {markdown_file} is not marked as published")
            return None
            
        html = self.markdown_to_html(markdown_content, metadata)
        
        # Generate output filename
        slug = metadata.get('slug', 'untitled')
        html_filename = f"{slug}.html"
        html_filepath = os.path.join(self.blog_dir, html_filename)
        
        with open(html_filepath, 'w') as f:
            f.write(html)
            
        print(f"Published: {html_filepath}")
        
        # Update posts index
        self.update_posts_index(metadata, html_filename)
        
        return html_filepath
    
    def update_posts_index(self, metadata, html_filename):
        """Update the posts index JSON file"""
        index_path = self.posts_index_file
        
        if os.path.exists(index_path):
            with open(index_path, 'r') as f:
                posts_index = json.load(f)
        else:
            posts_index = []
            
        # Add or update post in index
        post_data = {
            'title': metadata.get('title', 'Untitled'),
            'category': metadata.get('category', 'General'),
            'author': metadata.get('author', 'Bob'),
            'date': metadata.get('date', ''),
            'excerpt': metadata.get('excerpt', ''),
            'slug': metadata.get('slug', ''),
            'filename': html_filename,
            'published': True
        }
        
        # Remove existing entry if it exists
        posts_index = [p for p in posts_index if p.get('slug') != post_data['slug']]
        posts_index.append(post_data)
        
        # Sort by date (newest first)
        posts_index.sort(key=lambda x: x['date'], reverse=True)
        
        with open(index_path, 'w') as f:
            json.dump(posts_index, f, indent=2)
            
        print(f"Updated posts index: {index_path}")
    
    def generate_blog_index(self):
        """Generate the main blog index page"""
        if not os.path.exists(self.posts_index_file):
            print("No posts index found")
            return
            
        with open(self.posts_index_file, 'r') as f:
            posts = json.load(f)
            
        # Generate blog index HTML (this would integrate with the existing blog.html)
        print(f"Found {len(posts)} published posts")
        for post in posts:
            print(f"  - {post['title']} ({post['date']})")

def main():
    """Command line interface for blog management"""
    import sys
    
    blog_manager = BlogManager()
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python blog-manager.py create 'Post Title' 'Category' 'Excerpt'")
        print("  python blog-manager.py publish posts/2025-01-23-post-slug.md")
        print("  python blog-manager.py index")
        return
        
    command = sys.argv[1]
    
    if command == 'create':
        if len(sys.argv) < 4:
            print("Usage: python blog-manager.py create 'Post Title' 'Category' 'Excerpt'")
            return
        title = sys.argv[2]
        category = sys.argv[3]
        excerpt = sys.argv[4] if len(sys.argv) > 4 else ""
        blog_manager.create_post_template(title, category, excerpt=excerpt)
        
    elif command == 'publish':
        if len(sys.argv) < 3:
            print("Usage: python blog-manager.py publish posts/filename.md")
            return
        markdown_file = sys.argv[2]
        blog_manager.publish_post(markdown_file)
        
    elif command == 'index':
        blog_manager.generate_blog_index()
        
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()

