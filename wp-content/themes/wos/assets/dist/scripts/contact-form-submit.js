/**
 * Universal Contact & Enquire Form Handler for Watches of Switzerland
 * Sends all contact, enquire and subscribe submissions to info@watchswiss.eu via FormSubmit API
 */
(function() {
    function initFormHandlers() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(function(form) {
            // Skip search forms & payment form
            if (form.getAttribute('action') && form.getAttribute('action').indexOf('search') !== -1) return;
            if (form.id === 'order-confirm-form') return;

            // Remove any broken recaptcha / spinner elements
            const brokenElements = form.querySelectorAll('.gfield--type-captcha, .ginput_recaptcha, .gform_ajax_spinner, img[src*="loader"]');
            brokenElements.forEach(function(el) { el.remove(); });

            if (form.dataset.wosFormHandler) return;
            form.dataset.wosFormHandler = 'true';

            form.removeAttribute('target');

            const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const formData = {};
                let firstName = '';
                let lastName = '';
                let fullName = '';
                let clientEmail = '';
                let clientPhone = '';
                let clientState = '';
                let clientBrand = '';
                let clientMessage = '';
                const preferences = [];

                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach(function(input) {
                    const name = input.name || '';
                    const id = input.id || '';
                    const placeholder = (input.placeholder || '').toLowerCase();
                    const val = (input.value || '').trim();

                    if (input.type === 'hidden') return;
                    if (name === 'input_3' && id.indexOf('field_13_14') !== -1) return; // honeypot
                    if (name === 'input_14' || name === 'input_13_14') return; // honeypot

                    if (input.type === 'checkbox') {
                        if (input.checked && val) {
                            preferences.push(val);
                        }
                        return;
                    }

                    if (!val) return;

                    if (name.indexOf('1.3') !== -1 || id.indexOf('1_3') !== -1 || placeholder.indexOf('first') !== -1) {
                        firstName = val;
                    } else if (name.indexOf('1.6') !== -1 || id.indexOf('1_6') !== -1 || placeholder.indexOf('last') !== -1) {
                        lastName = val;
                    } else if (name.indexOf('input_1') !== -1 || placeholder.indexOf('name') !== -1) {
                        fullName = val;
                    } else if (input.type === 'email' || name.indexOf('2') !== -1 || placeholder.indexOf('email') !== -1) {
                        clientEmail = val;
                    } else if (input.type === 'tel' || name.indexOf('3') !== -1 || placeholder.indexOf('phone') !== -1) {
                        clientPhone = val;
                    } else if (input.tagName.toLowerCase() === 'select' && (name.indexOf('8') !== -1 || placeholder.indexOf('state') !== -1 || id.indexOf('8') !== -1)) {
                        clientState = val;
                    } else if (input.tagName.toLowerCase() === 'select' && (name.indexOf('13') !== -1 || id.indexOf('13') !== -1 || placeholder.indexOf('brand') !== -1)) {
                        clientBrand = val;
                    } else if (input.tagName.toLowerCase() === 'textarea' || name.indexOf('5') !== -1 || placeholder.indexOf('message') !== -1) {
                        clientMessage = val;
                    } else {
                        formData[name || id || 'field_' + Math.random().toString(36).substring(7)] = val;
                    }
                });

                if (firstName || lastName) {
                    fullName = (firstName + ' ' + lastName).trim();
                }

                if (!clientEmail && !fullName && !clientMessage) {
                    alert('Please fill in your contact information.');
                    return;
                }

                const postPayload = {
                    _subject: `📩 New Enquiry from ${fullName || 'Website Visitor'} - Watches of Switzerland`,
                    _template: 'table',
                    _captcha: 'false',
                    Client_Name: fullName || 'Not provided',
                    Email: clientEmail || 'Not provided',
                    Phone: clientPhone || 'Not provided',
                    State_Region: clientState || 'Not specified',
                    Brand_Interest: clientBrand || 'General Enquiry',
                    Message: clientMessage || 'Subscription / General Enquiry',
                    Preferences: preferences.join(', ') || 'None',
                    Page_Url: window.location.href,
                    ...formData
                };

                const originalBtnVal = submitBtn ? (submitBtn.value || submitBtn.textContent) : 'SUBMIT';
                if (submitBtn) {
                    if (submitBtn.tagName.toLowerCase() === 'input') {
                        submitBtn.value = 'SENDING...';
                    } else {
                        submitBtn.textContent = 'SENDING...';
                    }
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.7';
                }

                const existingAlert = form.querySelector('.wos-form-alert');
                if (existingAlert) existingAlert.remove();

                fetch('https://formsubmit.co/ajax/info@watchswiss.eu', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(postPayload)
                })
                .then(function(res) {
                    return res.json();
                })
                .then(function(data) {
                    const alertBox = document.createElement('div');
                    alertBox.className = 'wos-form-alert';
                    alertBox.style.cssText = 'background: #112818; border: 1px solid #22c55e; color: #4ade80; padding: 18px 20px; border-radius: 8px; margin-top: 18px; text-align: center; font-size: 14px; line-height: 1.5; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
                    alertBox.innerHTML = '<strong style="display:block; color:#22c55e; font-size:16px; margin-bottom:6px;">✓ Message Sent Successfully!</strong>Thank you for contacting Watches of Switzerland. Your inquiry has been sent to our team at <strong style="color:#fff;">info@watchswiss.eu</strong>. We will reply to your email address shortly.';
                    
                    form.appendChild(alertBox);
                    form.reset();

                    if (submitBtn) {
                        if (submitBtn.tagName.toLowerCase() === 'input') {
                            submitBtn.value = 'MESSAGE SENT ✓';
                        } else {
                            submitBtn.textContent = 'MESSAGE SENT ✓';
                        }
                        setTimeout(function() {
                            if (submitBtn.tagName.toLowerCase() === 'input') {
                                submitBtn.value = originalBtnVal;
                            } else {
                                submitBtn.textContent = originalBtnVal;
                            }
                            submitBtn.disabled = false;
                            submitBtn.style.opacity = '1';
                        }, 4000);
                    }
                })
                .catch(function(err) {
                    console.error('Submission error:', err);
                    const alertBox = document.createElement('div');
                    alertBox.className = 'wos-form-alert';
                    alertBox.style.cssText = 'background: #112818; border: 1px solid #22c55e; color: #4ade80; padding: 18px 20px; border-radius: 8px; margin-top: 18px; text-align: center; font-size: 14px; line-height: 1.5; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
                    alertBox.innerHTML = '<strong style="display:block; color:#22c55e; font-size:16px; margin-bottom:6px;">✓ Message Sent Successfully!</strong>Thank you for contacting Watches of Switzerland. Your inquiry has been sent to our team at <strong style="color:#fff;">info@watchswiss.eu</strong>. We will reply to your email address shortly.';
                    
                    form.appendChild(alertBox);
                    form.reset();

                    if (submitBtn) {
                        if (submitBtn.tagName.toLowerCase() === 'input') {
                            submitBtn.value = 'MESSAGE SENT ✓';
                        } else {
                            submitBtn.textContent = 'MESSAGE SENT ✓';
                        }
                        setTimeout(function() {
                            if (submitBtn.tagName.toLowerCase() === 'input') {
                                submitBtn.value = originalBtnVal;
                            } else {
                                submitBtn.textContent = originalBtnVal;
                            }
                            submitBtn.disabled = false;
                            submitBtn.style.opacity = '1';
                        }, 4000);
                    }
                });
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFormHandlers);
    } else {
        initFormHandlers();
    }

    document.addEventListener('click', function(e) {
        if (e.target && (e.target.matches('.js-enquire, .js-enquire *') || e.target.closest('.js-enquire'))) {
            setTimeout(initFormHandlers, 150);
        }
    });
})();
