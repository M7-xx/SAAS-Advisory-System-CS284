document.addEventListener('DOMContentLoaded', () => {

    // Sidebar & Menus logic
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const contacts = document.querySelector('.contacts');
        
        if (sidebar && sidebar.classList.contains('show') && !e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-btn') && !e.target.closest('.mobile-btn')) {
            sidebar.classList.remove('show');
        }
        if (contacts && contacts.classList.contains('show') && !e.target.closest('.contacts') && !e.target.closest('.mobile-btn')) {
            contacts.classList.remove('show');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                this.classList.add('active');
                setTimeout(() => {
                    this.classList.remove('active');
                    this.blur();
                }, 500);
            }
        });
    });

    // Secret "Reset Demo" button for mobile/presentations
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
        // Styles to make it look faint and hidden in the bottom right of the sidebar
        resetBtn.style.cssText = 'position: absolute; bottom: 15px; right: 15px; background: none; border: none; color: rgba(255,255,255,0.15); font-size: 1.2rem; cursor: pointer; z-index: 9999; padding: 10px;';
        resetBtn.onclick = () => {
            if (confirm('Secret Menu: Do you want to reset all prototype data?')) {
                localStorage.clear();
                window.location.href = 'index.html'; // Redirects back to the login page for a fresh start!
            }
        };
        sidebar.appendChild(resetBtn);
    }

    // Dynamic Booking logic
    const confirmBtn = document.querySelector('.btn-confirm');
    if (confirmBtn) {
        const slots = document.querySelectorAll('.slot.available');
        slots.forEach(slot => {
            slot.addEventListener('click', function() {
                slots.forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

        confirmBtn.addEventListener('click', function() {
            const selectedSlot = document.querySelector('.slot.selected');
            const subject = document.querySelector('.subject-input').value.trim();
            
            if (!selectedSlot) {
                alert('Please select an available time slot first.');
                return;
            }
            if (subject === '') {
                alert('Please enter a meeting subject before confirming.');
                return;
            }
            
            const day = selectedSlot.closest('.day-column').querySelector('strong').textContent;
            const time = selectedSlot.textContent;
            
            localStorage.setItem('saas_upcoming_session', JSON.stringify({ day, time, subject }));
            
            alert(`✅ Appointment successfully requested for ${day} at ${time}!\nSubject: ${subject}`);
            
            selectedSlot.classList.remove('selected', 'available');
            selectedSlot.classList.add('booked');
            document.querySelector('.subject-input').value = ''; 
        });
    }

    const upcomingSessionCard = document.getElementById('upcoming-session-card');
    if (upcomingSessionCard) {
        const savedSession = localStorage.getItem('saas_upcoming_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            upcomingSessionCard.innerHTML = `
                <div class="card-header"><i class="fa-solid fa-clock"></i> <h3>Upcoming Session</h3></div>
                <p><strong>Advisor:</strong> Dr. Abdulmajeed Aljuhani</p>
                <p><strong>Date:</strong> ${session.day}, ${session.time}</p>
                <p><strong>Subject:</strong> ${session.subject}</p>
                <p><span class="status-badge">Confirmed</span></p>
                <button class="btn cancel-btn" style="background: transparent; border: 1px solid #e74c3c; color: #e74c3c; margin-top: 15px;">Cancel Booking</button>
            `;
            
            upcomingSessionCard.querySelector('.cancel-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel this booking?')) {
                    localStorage.removeItem('saas_upcoming_session');
                    location.reload();
                }
            });
        }
    }

    // Persist booked slots in Booking page on load
    const savedSessionData = localStorage.getItem('saas_upcoming_session');
    if (savedSessionData) {
        const session = JSON.parse(savedSessionData);
        document.querySelectorAll('.day-column').forEach(col => {
            if (col.querySelector('strong').textContent === session.day) {
                col.querySelectorAll('.slot').forEach(slot => {
                    if (slot.textContent === session.time) {
                        slot.classList.remove('available', 'selected');
                        slot.classList.add('booked');
                    }
                });
            }
        });
    }

    // --- Real-time Chat Sync ---
    const isAdvisor = document.title.includes('Advisor Messages');
    const isStudentChat = document.title.includes('Academic Chat');
    
    // Function to dynamically show unread badges
    function showUnreadBadge(studentId) {
        const contactItem = document.getElementById(`contact-${studentId}`);
        if (!contactItem) return;
        let badge = contactItem.querySelector('.unread-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'unread-badge';
            badge.textContent = '1';
            contactItem.appendChild(badge);
        }
        badge.style.display = 'flex';
        
        const name = contactItem.querySelector('strong');
        const preview = contactItem.querySelector('p');
        if (name) name.style.color = 'var(--taibah-blue)';
        if (preview) {
            preview.style.fontWeight = '600';
            preview.style.color = 'var(--text-dark)';
        }
    }

    // Give chat a starting history if it is empty
    if (isAdvisor || isStudentChat) {
        // Use specific keys for each chat
        if (!localStorage.getItem('saas_chat_messages_mohammed')) {
            localStorage.setItem('saas_chat_messages_mohammed', JSON.stringify([
                { sender: 'advisor', text: "Hello Mohammed, I've approved your **CS284** request.", time: "10:14 AM" },
                { sender: 'student', text: "Thank you Doctor! I'll check it right away. Do I need to visit your office for a signature?", time: "10:45 AM" },
                { sender: 'advisor', text: "No, the digital approval in SAAS is enough.", time: "11:02 AM" }
            ]));
        }
        if (isAdvisor && !localStorage.getItem('saas_chat_messages_abdulaziz')) {
            localStorage.setItem('saas_chat_messages_abdulaziz', JSON.stringify([
                { sender: 'student', text: "When is the next available slot for registration?", time: "Yesterday, 3:30 PM" }
            ]));
            localStorage.setItem('saas_unread_abdulaziz', 'true'); // Set demo badge
        }
        
        // Render the default chat only for the student
        if (!isAdvisor) {
            renderMessages('mohammed');
        }
        
        // Force update previews for all known contacts on load
        if (isAdvisor) {
            updatePreviewUI('mohammed');
            updatePreviewUI('abdulaziz');
            
            ['mohammed', 'abdulaziz'].forEach(id => {
                if (localStorage.getItem(`saas_unread_${id}`) === 'true') showUnreadBadge(id);
            });
        }
    }

    function updatePreviewUI(studentId) {
        const storageKey = `saas_chat_messages_${studentId}`;
        const msgs = JSON.parse(localStorage.getItem(storageKey)) || [];
        if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            // Safety check in case the saved object got corrupted
            const lastMsgText = (typeof lastMsg === 'object' ? lastMsg.text : lastMsg) || '';
            const cleanText = lastMsgText.replace(/\*\*/g, ''); 
            const snippet = cleanText.length > 20 ? cleanText.substring(0, 20) + '...' : cleanText;
            
            let previewEl = isAdvisor ? document.querySelector(`#contact-${studentId} p`) : document.querySelector('.contacts .contact-item p');
            if (previewEl) previewEl.textContent = snippet;
        }
    }

    function renderMessages(studentId) {
        // In student view, studentId is undefined, defaults to mohammed
        const currentStudentId = studentId || 'mohammed'; 
        const storageKey = `saas_chat_messages_${currentStudentId}`;

        let chatContainer;
        if (isAdvisor) {
            chatContainer = document.getElementById(`chat-area-${currentStudentId}`);
        } else {
            chatContainer = document.getElementById('student-chat-area');
        }

        if (!chatContainer) return;
        chatContainer.innerHTML = ''; 
        const msgs = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        msgs.forEach(msg => {
            if (!msg) return; // Skip corrupted empty entries
            const bubble = document.createElement('div');
            
            // Safely extract properties
            const sender = msg.sender || 'student';
            const text = msg.text || (typeof msg === 'string' ? msg : '');
            const time = msg.time || '';
            
            const isSent = (isAdvisor && sender === 'advisor') || (isStudentChat && sender === 'student');
            bubble.className = isSent ? 'bubble chat-sent' : 'bubble chat-received';
            
            bubble.innerHTML = `${text} ${time ? `<span class="time">${time}</span>` : ''}`;
            chatContainer.appendChild(bubble);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Update the preview text in the contact list
        updatePreviewUI(currentStudentId);
    }

    document.querySelectorAll('.send-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.closest('.input-bar').querySelector('input');
            if (!input) return;
            const text = input.value.trim();
            if (text === '') return;
            
            const windowDiv = this.closest('.window');
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let studentId = 'mohammed'; // Default for student view
            if (isAdvisor) {
                studentId = windowDiv.id.replace('chat-', ''); // 'mohammed' or 'abdulaziz'
            }
            const storageKey = `saas_chat_messages_${studentId}`;
            
            const msgs = JSON.parse(localStorage.getItem(storageKey)) || [];
            msgs.push({ sender: isAdvisor ? 'advisor' : 'student', text, time });
            localStorage.setItem(storageKey, JSON.stringify(msgs));
            
            // If student sends a message, set the unread flag for the Advisor
            if (!isAdvisor) {
                localStorage.setItem(`saas_unread_${studentId}`, 'true');
            }

            renderMessages(studentId);
            
            input.value = '';
        });
    });

    document.querySelectorAll('.input-bar input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') this.closest('.input-bar').querySelector('.send-btn').click();
        });
    });

    // Cross-tab Event Listener for real-time magic
    window.addEventListener('storage', (e) => {
        // If e.key is null, localStorage.clear() was triggered. Reload to reflect the clean slate!
        if (!e.key) {
            location.reload();
            return;
        }

        if (e.key.startsWith('saas_chat_messages_')) {
            const studentId = e.key.replace('saas_chat_messages_', '');
            // Prevent Abdulaziz's messages from appearing on Mohammed's student view
            if (!isAdvisor && studentId !== 'mohammed') return;
            
            const activeChat = document.getElementById(`chat-${studentId}`);
            const isCurrentlyOpen = activeChat && activeChat.style.display !== 'none';
            
            if (isCurrentlyOpen || !isAdvisor) {
                renderMessages(studentId);
            } else if (isAdvisor) {
                showUnreadBadge(studentId);
                updatePreviewUI(studentId);
            }
        }
        if (e.key === 'saas_course_requests') {
            renderAdvisorRequests();
            renderStudentRequests();
        }
        if (e.key === 'saas_upcoming_session' && document.getElementById('notification-text')) location.reload();
    });

    // --- Course Request Loop (Dual-Side) ---
    // Initialize default requests if empty (for presentation purposes)
    if (!localStorage.getItem('saas_course_requests')) {
        localStorage.setItem('saas_course_requests', JSON.stringify([
            { course: 'CS284', id: '44000XXX', name: 'Mohammed', type: 'Add Course', status: 'pending' }
        ]));
    }

    const submitReqBtn = document.getElementById('submit-request-btn');
    if (submitReqBtn) {
        submitReqBtn.addEventListener('click', () => {
            const input = document.getElementById('course-input');
            const nameInput = document.getElementById('student-name-input');
            const typeSelect = document.getElementById('request-type-select');
            
            const val = input.value.trim().toUpperCase();
            const nameVal = nameInput.value.trim();
            const typeVal = typeSelect.value;
            
            if (!val || !nameVal) {
                alert('Please enter both your Name and a Course Code.');
                return;
            }
            
            let requests = JSON.parse(localStorage.getItem('saas_course_requests')) || [];
            const randomId = '4400' + Math.floor(1000 + Math.random() * 9000); // Generate fake ID
            requests.push({ course: val, id: randomId, name: nameVal, type: typeVal, status: 'pending' });
            localStorage.setItem('saas_course_requests', JSON.stringify(requests));
            
            document.getElementById('request-modal').classList.remove('show');
            input.value = '';
            nameInput.value = '';
            
            renderStudentRequests();
            alert(`✅ ${typeVal} request for ${val} submitted successfully!`);
        });
    }

    function renderStudentRequests() {
        const list = document.getElementById('student-requests-list');
        const card = document.getElementById('student-requests-card');
        if (!list || !card) return;
        
        let requests = JSON.parse(localStorage.getItem('saas_course_requests')) || [];
        if (requests.length === 0) { card.style.display = 'none'; return; }
        
        card.style.display = 'block';
        list.innerHTML = '';
        
        // Render newest at the top
        [...requests].reverse().forEach(req => {
            let statusHtml = '';
            if (req.status === 'pending') statusHtml = '<span class="status-badge" style="background: #fef08a; color: #b45309;">Pending Advisor</span>';
            else if (req.status === 'approved') statusHtml = '<span class="status-badge" style="background: #def7ec; color: #03543f;">Approved</span>';
            else if (req.status === 'rejected') statusHtml = '<span class="status-badge" style="background: #fef2f2; color: #991b1b;">Rejected</span>';
            
            const item = document.createElement('div');
            item.style.cssText = "padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc;";
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <strong>${req.course}</strong> ${statusHtml}
                </div>
                <div style="font-size: 0.85rem; color: #64748b;">${req.type} | Submitted by: ${req.name}</div>
            `;
            list.appendChild(item);
        });
    }

    function renderAdvisorRequests() {
        const requestsBody = document.getElementById('pending-requests-body');
        if (!requestsBody) return;
        
        let requests = JSON.parse(localStorage.getItem('saas_course_requests')) || [];
        requestsBody.innerHTML = '';
        if (requests.length === 0) { requestsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No requests found.</td></tr>'; return; }
        
        requests.forEach((req, index) => {
            const tr = document.createElement('tr');
            let actionHTML = '';
            let rowBg = '';
            
            if (req.status === 'pending') {
                actionHTML = `<button class="btn-action approve dynamic-approve" data-index="${index}">Approve</button> <button class="btn-action reject dynamic-reject" data-index="${index}">Reject</button>`;
            } else if (req.status === 'approved') {
                actionHTML = '<span style="color: #2ecc71; font-weight: bold;"><i class="fa-solid fa-check"></i> Approved</span>'; rowBg = 'background-color: #f0fdf4;';
            } else if (req.status === 'rejected') {
                actionHTML = '<span style="color: #e74c3c; font-weight: bold;"><i class="fa-solid fa-xmark"></i> Rejected</span>'; rowBg = 'background-color: #fef2f2;';
            }
            if (rowBg) tr.style = rowBg;
            
            tr.innerHTML = `<td data-label="Student ID">${req.id}</td><td data-label="Student Name">${req.name}</td><td data-label="Course Code"><strong>${req.course}</strong></td><td data-label="Request Type"><span class="badge">${req.type}</span></td><td data-label="Actions">${actionHTML}</td>`;
            requestsBody.appendChild(tr);
        });

        document.querySelectorAll('.dynamic-approve, .dynamic-reject').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const isApprove = this.classList.contains('dynamic-approve');
                let reqs = JSON.parse(localStorage.getItem('saas_course_requests'));
                reqs[index].status = isApprove ? 'approved' : 'rejected';
                localStorage.setItem('saas_course_requests', JSON.stringify(reqs));
                
                renderAdvisorRequests();
                renderStudentRequests(); // Sync dashboard in real-time
            });
        });
    }
    
    renderStudentRequests();
    renderAdvisorRequests();

    // --- Option 3: Render Dynamic Notification ---
    const notifText = document.getElementById('notification-text');
    if (notifText) {
        const savedSession = localStorage.getItem('saas_upcoming_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            notifText.innerHTML = `You have a <strong style="color:var(--taibah-blue)">new appointment request</strong> from Mohammed for <strong>${session.day}, ${session.time}</strong>.`;
        }
    }

    // Global function for Advisor Chat switching
    window.switchChat = function(studentId) {
        // Hide all chats
        document.querySelectorAll('.chat-container .window').forEach(win => win.style.display = 'none');
        
        // Remove active highlight from all contacts
        document.querySelectorAll('.chat-container .contact-item').forEach(item => item.classList.remove('active'));
        
        // Show the selected chat and highlight the contact
        const activeChat = document.getElementById('chat-' + studentId);
        const activeContact = document.getElementById('contact-' + studentId);
        if (activeChat) activeChat.style.display = 'flex';
        if (activeContact) activeContact.classList.add('active');
        
        // Render messages for the now-active chat
        renderMessages(studentId);

        // Mark chat as read and clear badges dynamically for any student
        localStorage.setItem(`saas_unread_${studentId}`, 'false');
        if (activeContact) {
            const badge = activeContact.querySelector('.unread-badge');
            if (badge) badge.style.display = 'none';
            
            const name = activeContact.querySelector('strong');
            if (name) name.style.color = '';
            
            const preview = activeContact.querySelector('p');
            if (preview) {
                preview.style.fontWeight = 'normal';
                preview.style.color = '#64748b';
            }
        }
        
        // Automatically close the mobile contact list after tapping a name
        if (window.innerWidth <= 768) {
            const contacts = document.querySelector('.contacts');
            if (contacts) contacts.classList.remove('show');
        }
    };
});