// Add to existing JavaScript

// Newsletter subscription
function setupNewsletterSubscription() {
    const form = document.getElementById('newsletter-form');
    const emailInput = document.getElementById('newsletter-email');
    const submitBtn = document.getElementById('newsletter-btn');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        
        if (!email || !isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Subscribing...';
        submitBtn.classList.add('newsletter-loading');
        submitBtn.disabled = true;
        
        try {
            // Check if email already exists
            const existingSubscriber = await db.collection('subscribers')
                .where('email', '==', email)
                .get();
            
            if (!existingSubscriber.empty) {
                showNotification('You are already subscribed!', 'error');
                return;
            }
            
            // Add new subscriber
            await db.collection('subscribers').add({
                email: email,
                subscribedAt: firebase.firestore.Timestamp.now(),
                active: true,
                source: 'blog'
            });
            
            // Success animation
            submitBtn.classList.add('newsletter-success');
            submitBtn.innerHTML = '<i class="bx bx-check"></i> Subscribed!';
            emailInput.value = '';
            
            showNotification('Successfully subscribed! Welcome aboard!');
            
            // Reset button after 3 seconds
            setTimeout(() => {
                submitBtn.classList.remove('newsletter-success', 'newsletter-loading');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
            
        } catch (error) {
            console.error('Subscription error:', error);
            showNotification('Failed to subscribe. Please try again.', 'error');
        } finally {
            if (!submitBtn.classList.contains('newsletter-success')) {
                submitBtn.classList.remove('newsletter-loading');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });
}

// Email validation helper
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Modified saveArticle function to trigger email notifications
async function saveArticle() {
    if (!currentUser) {
        showNotification('Please login to save articles', 'error');
        return;
    }
    
    const title = document.getElementById('article-title').value.trim();
    const content = document.getElementById('article-content').value.trim();
    
    if (!title || !content) {
        showNotification('Title and Content are required', 'error');
        return;
    }
    
    const excerpt = document.getElementById('article-excerpt').value.trim();
    const tags = Array.from(document.querySelectorAll('#tags-container .tag-item span:first-child')).map(tag => tag.textContent);
    
    const saveBtn = document.getElementById('save-article');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';
    saveBtn.disabled = true;

    try {
        const articleData = {
            title,
            excerpt: excerpt || content.substring(0, 150) + "...",
            content,
            tags: tags.length ? tags : ['general'],
            updatedAt: firebase.firestore.Timestamp.now(),
            author: currentUser.email
        };

        if (editingArticleId) {
            await db.collection('articles').doc(editingArticleId).update(articleData);
            showNotification('Article updated successfully!');
        } else {
            articleData.createdAt = firebase.firestore.Timestamp.now();
            const docRef = await db.collection('articles').add(articleData);
            
            // Trigger email notification for new articles
            await triggerEmailNotification({
                ...articleData,
                id: docRef.id
            });
            
            showNotification('Article saved and subscribers notified!');
        }
        
        resetAdminForm();
        closeAdminPanel();
        await loadArticles();
        
    } catch (error) {
        showNotification('Error saving article: ' + error.message, 'error');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Email notification trigger
async function triggerEmailNotification(article) {
    try {
        // Add notification job to queue
        await db.collection('emailQueue').add({
            type: 'new_article',
            articleData: {
                id: article.id,
                title: article.title,
                excerpt: article.excerpt,
                tags: article.tags,
                url: `${window.location.origin}${window.location.pathname}?article=${article.id}`
            },
            createdAt: firebase.firestore.Timestamp.now(),
            processed: false
        });
        
        console.log('Email notification queued successfully');
    } catch (error) {
        console.error('Error queuing email notification:', error);
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeAuth();
    loadArticles();
    setupEventListeners();
    setupAdminPanel();
    setupNewsletterSubscription(); // Add this line
});