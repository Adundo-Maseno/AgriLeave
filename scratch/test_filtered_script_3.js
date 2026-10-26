
            (function () {
                // Internal state
                const AIState = {
                    isOpen: false,
                    isLoading: false,
                    history: [],
                    isConfigured: false,
                    userRole: 'staff'
                };

                // Role-Specific Quick Suggestion Chips (Agentic task prompts)
                const ROLE_CHIPS = {
                    staff: [
                        { label: 'My Leave Balance', icon: 'fa-chart-pie', q: 'How many annual, sick, and compensation leave days do I currently have available?' },
                        { label: 'Apply for Leave', icon: 'fa-calendar-plus', q: 'What are the requirements to apply for leave and what is my available balance?' },
                        { label: 'My Applications', icon: 'fa-file-lines', q: 'What is the status of my recent leave applications?' },
                        { label: 'Public Holidays', icon: 'fa-calendar-day', q: 'When are the upcoming gazetted public holidays?' },
                        { label: 'Sick Leave Policy', icon: 'fa-notes-medical', q: 'What is the company policy for sick leave and when is a medical certificate required?' },
                        { label: 'Carry Forward Limits', icon: 'fa-rotate-right', q: 'How does annual leave carry-forward work and what is the maximum limit?' },
                        { label: 'Claim Overtime / TOIL', icon: 'fa-clock', q: 'How do I claim TOIL (Time Off In Lieu) for weekend or holiday work?' }
                    ],
                    supervisor: [
                        { label: 'Pending Approvals', icon: 'fa-clock', q: 'Do I have any pending leave applications awaiting my review as a supervisor?' },
                        { label: 'Team Balances', icon: 'fa-users', q: 'What are the current leave balances for my direct reports?' },
                        { label: 'Team Absences (30 Days)', icon: 'fa-users-viewfinder', q: 'Who in my direct team is currently on leave or scheduled for leave in the next 30 days?' },
                        { label: 'Handover Policy', icon: 'fa-handshake', q: 'What are the handover requirements before leave is endorsed?' },
                        { label: 'My Personal Balance', icon: 'fa-chart-pie', q: 'What is my personal leave balance across all categories?' },
                        { label: 'Upcoming Holidays', icon: 'fa-calendar-day', q: 'When are the upcoming gazetted public holidays?' }
                    ],
                    hr: [
                        { label: 'Company Overview', icon: 'fa-building', q: 'Give me a summary of total staff, active leaves today, and company-wide pending applications.' },
                        { label: 'Staff Balances', icon: 'fa-users', q: 'Show me the leave balances for all staff members across the company.' },
                        { label: 'Leave Liability', icon: 'fa-coins', q: 'What is the company financial leave liability and unconsumed leave exposure?' },
                        { label: 'Year-End Process', icon: 'fa-calendar-check', q: 'When is the year-end processing and what happens?' },
                        { label: 'On Leave Today', icon: 'fa-user-check', q: 'Which staff members across all departments are currently on approved leave today?' },
                        { label: 'Pending Queue', icon: 'fa-inbox', q: 'How many leave applications are currently pending supervisor review across the company?' },
                        { label: 'Accrual Settings', icon: 'fa-sliders', q: 'What are the system configuration settings for annual allocation, sick days, and carry forward?' }
                    ],
                    admin: [
                        { label: 'System Overview', icon: 'fa-server', q: 'Give me a summary of total staff, active leaves today, and system leave parameters.' },
                        { label: 'Staff Balances', icon: 'fa-users', q: 'Show me the leave balances for all staff members across the company.' },
                        { label: 'Year-End Process', icon: 'fa-calendar-check', q: 'When is the year-end processing and what happens during rollover?' },
                        { label: 'Pending Queue', icon: 'fa-inbox', q: 'Show me pending leave applications and supervisor review queues.' },
                        { label: 'AI Status', icon: 'fa-robot', q: 'Is the Gemini AI model and knowledge base active and configured?' },
                        { label: 'Leave Policies', icon: 'fa-book', q: 'Summarize the core leave entitlement and accrual rules for Agri Experience.' }
                    ]
                };

                // DOM Elements
                let toggleBtn, chatPanel, closeBtn, clearBtn, form, input, sendBtn, messagesContainer, chipsContainer, roleBadge, roleLabel, apiKeyModalBtn, apiKeyModal, closeApiKeyModalBtn, cancelApiKeyModalBtn, saveApiKeyBtn, apiKeyInput, apiKeyStatusMsg, tooltip, chatBackdrop, chatDragHandle;

                function initElements() {
                    toggleBtn = document.getElementById('aiChatToggleBtn');
                    chatPanel = document.getElementById('aiChatPanel');
                    closeBtn = document.getElementById('aiCloseChatBtn');
                    clearBtn = document.getElementById('aiClearChatBtn');
                    form = document.getElementById('aiChatForm');
                    input = document.getElementById('aiChatInput');
                    sendBtn = document.getElementById('aiSendBtn');
                    messagesContainer = document.getElementById('aiMessagesContainer');
                    chipsContainer = document.getElementById('aiQuickChips');
                    roleBadge = document.getElementById('aiChatRoleBadge');
                    roleLabel = document.getElementById('aiRoleLabel');
                    apiKeyModalBtn = document.getElementById('aiApiKeyModalBtn');
                    apiKeyModal = document.getElementById('aiApiKeyModal');
                    closeApiKeyModalBtn = document.getElementById('closeAiApiKeyModal');
                    cancelApiKeyModalBtn = document.getElementById('cancelAiApiKeyBtn');
                    saveApiKeyBtn = document.getElementById('saveAiApiKeyBtn');
                    apiKeyInput = document.getElementById('aiApiKeyInput');
                    apiKeyStatusMsg = document.getElementById('aiApiKeyStatusMsg');
                    tooltip = document.getElementById('aiChatTooltip');
                    chatBackdrop = document.getElementById('aiChatBackdrop');
                    chatDragHandle = document.getElementById('aiChatDragHandle');
                }

                function bindEvents() {
                    if (toggleBtn) {
                        toggleBtn.addEventListener('click', function () {
                            toggleChat();
                        });
                    }

                    if (closeBtn) {
                        closeBtn.addEventListener('click', function () {
                            toggleChat(false);
                        });
                    }

                    if (clearBtn) {
                        clearBtn.addEventListener('click', function () {
                            clearChat();
                        });
                    }

                    if (chatBackdrop) {
                        chatBackdrop.addEventListener('click', function () {
                            toggleChat(false);
                        });
                    }

                    if (chatDragHandle) {
                        chatDragHandle.addEventListener('click', function () {
                            toggleChat(false);
                        });
                    }

                    if (form) {
                        form.addEventListener('submit', function (e) {
                            e.preventDefault();
                            handleSendMessage();
                        });
                    }

                    if (apiKeyModalBtn) {
                        apiKeyModalBtn.addEventListener('click', function () {
                            openApiKeyModal();
                        });
                    }

                    if (closeApiKeyModalBtn) closeApiKeyModalBtn.addEventListener('click', closeApiKeyModal);
                    if (cancelApiKeyModalBtn) cancelApiKeyModalBtn.addEventListener('click', closeApiKeyModal);
                    const backdrop = document.getElementById('aiApiKeyModalBackdrop');
                    if (backdrop) backdrop.addEventListener('click', closeApiKeyModal);

                    if (saveApiKeyBtn) {
                        saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
                    }

                    // Delegate clickable action links in assistant responses
                    document.addEventListener('click', function (e) {
                        const actionBtn = e.target.closest('.ai-action-link');
                        if (actionBtn) {
                            const action = actionBtn.getAttribute('data-action');
                            if (action && typeof navigateTo === 'function') {
                                navigateTo(action);
                                if (window.innerWidth < 640) {
                                    toggleChat(false);
                                }
                            }
                        }

                        // Delegate copy buttons in assistant responses
                        const copyBtn = e.target.closest('.ai-copy-btn');
                        if (copyBtn) {
                            const rawText = copyBtn.getAttribute('data-copy') || '';
                            if (rawText && navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(rawText).then(() => {
                                    const orig = copyBtn.innerHTML;
                                    copyBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-600"></i>';
                                    copyBtn.title = 'Copied!';
                                    setTimeout(() => {
                                        copyBtn.innerHTML = orig;
                                        copyBtn.title = 'Copy response';
                                    }, 2000);
                                }).catch(() => {});
                            }
                        }
                    });
                }

                function toggleChat(forceOpen) {
                    AIState.isOpen = typeof forceOpen === 'boolean' ? forceOpen : !AIState.isOpen;
                    if (AIState.isOpen) {
                        if (chatPanel) chatPanel.classList.remove('hidden');
                        if (chatBackdrop && window.innerWidth < 640) chatBackdrop.classList.remove('hidden');
                        if (tooltip) tooltip.classList.add('hidden');
                        if (window.innerWidth < 640) {
                            document.body.classList.add('overflow-hidden');
                        }
                        setTimeout(() => input && input.focus(), 150);
                        syncRoleUI();
                        scrollToBottom();
                    } else {
                        if (chatPanel) chatPanel.classList.add('hidden');
                        if (chatBackdrop) chatBackdrop.classList.add('hidden');
                        if (window.innerWidth < 640) {
                            document.body.classList.remove('overflow-hidden');
                        }
                    }
                }

                function syncRoleUI() {
                    const role = (AppState && AppState.userRole ? AppState.userRole.toLowerCase() : 'staff');
                    AIState.userRole = role;

                    if (roleBadge) {
                        roleBadge.textContent = role.toUpperCase();
                        if (role === 'admin' || role === 'hr') {
                            roleBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase tracking-wide';
                        } else if (role === 'supervisor') {
                            roleBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wide';
                        } else {
                            roleBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide';
                        }
                    }

                    if (roleLabel) {
                        roleLabel.textContent = role === 'admin' || role === 'hr' ? 'HR / Management' : (role === 'supervisor' ? 'Team Lead' : 'Staff');
                    }

                    // Show API Key modal button for Admin / HR
                    if (apiKeyModalBtn) {
                        if (role === 'admin' || role === 'hr') {
                            apiKeyModalBtn.classList.remove('hidden');
                        } else {
                            apiKeyModalBtn.classList.add('hidden');
                        }
                    }

                    renderQuickChips(role);
                }

                function renderQuickChips(role) {
                    if (!chipsContainer) return;
                    chipsContainer.innerHTML = '';
                    const chips = ROLE_CHIPS[role] || ROLE_CHIPS.staff;
                    chips.forEach(chip => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'quick-chip flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 border border-gray-200 rounded-full text-[11px] font-medium text-gray-700 whitespace-nowrap transition-all flex-shrink-0 shadow-2xs';
                        btn.innerHTML = `<i class="fa-solid ${chip.icon} text-emerald-600 text-[10px]"></i><span>${chip.label}</span>`;
                        btn.addEventListener('click', function () {
                            if (AIState.isLoading) return;
                            if (input) input.value = chip.q;
                            handleSendMessage();
                        });
                        chipsContainer.appendChild(btn);
                    });
                }

                function handleSendMessage() {
                    if (!input || AIState.isLoading) return;
                    const message = input.value.trim();
                    if (!message) return;

                    input.value = '';
                    appendUserMessage(message);
                    AIState.history.push({ role: 'user', content: message });

                    AIState.isLoading = true;
                    if (sendBtn) sendBtn.disabled = true;
                    const loaderId = appendTypingIndicator();

                    callGoogleScriptFunction('apiAskLeaveAssistant', {
                        message: message,
                        history: AIState.history.slice(-6)
                    }, 75000)
                        .then(result => {
                            removeMessageElement(loaderId);
                            AIState.isLoading = false;
                            if (sendBtn) sendBtn.disabled = false;

                            if (result && result.data && result.data.answer) {
                                appendAssistantMessage(result.data.answer);
                                AIState.history.push({ role: 'assistant', content: result.data.answer });
                                if (result.data.requiresSetup && (AIState.userRole === 'admin' || AIState.userRole === 'hr')) {
                                    setTimeout(() => openApiKeyModal(), 600);
                                }
                            } else if (result && result.message) {
                                appendAssistantMessage(result.message);
                            } else {
                                appendAssistantMessage('Received empty response from assistant.');
                            }
                        })
                        .catch(err => {
                            removeMessageElement(loaderId);
                            AIState.isLoading = false;
                            if (sendBtn) sendBtn.disabled = false;
                            appendAssistantMessage(`⚠️ **Error processing request**: ${err.message || 'Server timeout'}. Please try again.`);
                        });
                }

                function appendUserMessage(text) {
                    const row = document.createElement('div');
                    row.className = 'flex justify-end';
                    row.innerHTML = `
                        <div class="bg-gradient-to-tr from-emerald-700 to-emerald-600 text-white rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[85%] shadow-sm text-xs leading-relaxed">
                            <p class="whitespace-pre-wrap">${escapeHTML(text)}</p>
                        </div>
                    `;
                    messagesContainer.appendChild(row);
                    scrollToBottom();
                }

                function generateAgenticActionCards(text, userRole) {
                    const lower = (text || '').toLowerCase();
                    const actions = [];

                    if (lower.includes('apply') || lower.includes('available') || lower.includes('annual leave') || lower.includes('balance')) {
                        actions.push({
                            label: 'Apply for Leave',
                            icon: 'fa-calendar-plus',
                            cls: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200',
                            handler: 'openApplyLeaveModal(); if (window.innerWidth < 640) toggleChat(false);'
                        });
                    }

                    if (lower.includes('my application') || lower.includes('status') || lower.includes('recent application') || lower.includes('pending')) {
                        actions.push({
                            label: 'My Applications',
                            icon: 'fa-file-lines',
                            cls: 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200',
                            handler: "navigateToPage('myApplicationsPage'); if (window.innerWidth < 640) toggleChat(false);"
                        });
                    }

                    if ((userRole === 'supervisor' || userRole === 'admin' || userRole === 'hr') &&
                        (lower.includes('approval') || lower.includes('queue') || lower.includes('team') || lower.includes('review'))) {
                        actions.push({
                            label: 'Team Approvals',
                            icon: 'fa-user-check',
                            cls: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200',
                            handler: "navigateToPage('supervisorApprovalsPage'); if (window.innerWidth < 640) toggleChat(false);"
                        });
                    }

                    if (lower.includes('toil') || lower.includes('overtime') || lower.includes('compensation')) {
                        actions.push({
                            label: 'Claim TOIL',
                            icon: 'fa-clock',
                            cls: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200',
                            handler: "if (typeof openTOILClaimModal === 'function') openTOILClaimModal(); if (window.innerWidth < 640) toggleChat(false);"
                        });
                    }

                    if (lower.includes('holiday') || lower.includes('gazetted') || lower.includes('calendar') || lower.includes('wallchart')) {
                        actions.push({
                            label: 'Team Wallchart',
                            icon: 'fa-calendar-days',
                            cls: 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200',
                            handler: "navigateToPage('teamWallchartPage'); if (window.innerWidth < 640) toggleChat(false);"
                        });
                    }

                    if (actions.length === 0) return '';

                    return `
                        <div class="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                            <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-0.5 flex items-center gap-1">
                                <i class="fa-solid fa-bolt text-amber-500 text-[9px]"></i> Action:
                            </span>
                            ${actions.slice(0, 3).map(act => `
                                <button type="button" onclick="${act.handler}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold active:scale-95 transition-all shadow-2xs ${act.cls} cursor-pointer">
                                    <i class="fa-solid ${act.icon} text-[10px]"></i>
                                    <span>${act.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    `;
                }

                function appendAssistantMessage(text) {
                    const row = document.createElement('div');
                    row.className = 'flex items-start gap-2.5 group';
                    const formattedHtml = formatAIMarkdown(text);
                    const safeAttr = escapeAttr(text);
                    const actionCardsHtml = generateAgenticActionCards(text, AIState.userRole);
                    row.innerHTML = `
                        <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-emerald-200 shadow-2xs">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <div class="relative bg-white border border-gray-200/80 rounded-2xl rounded-tl-none p-3 shadow-xs text-xs text-gray-800 leading-relaxed max-w-[88%] space-y-1.5">
                            <button type="button" class="ai-copy-btn absolute top-2 right-2 p-1.5 text-gray-400 hover:text-emerald-700 text-[11px] rounded-lg hover:bg-slate-100 transition-colors opacity-70 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer" title="Copy response" data-copy="${safeAttr}">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <div class="pr-5">
                                ${formattedHtml}
                            </div>
                            ${actionCardsHtml}
                        </div>
                    `;
                    messagesContainer.appendChild(row);
                    scrollToBottom();
                }

                function appendTypingIndicator() {
                    const id = 'aiTyping_' + Date.now();
                    const row = document.createElement('div');
                    row.id = id;
                    row.className = 'flex items-start gap-2.5';
                    row.innerHTML = `
                        <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-emerald-200">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <div class="bg-white border border-gray-200/80 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-xs text-gray-500 max-w-[88%] flex items-center gap-1.5">
                            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style="animation-delay: 0.2s"></span>
                            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style="animation-delay: 0.4s"></span>
                            <span class="text-[11px] text-gray-400 ml-1.5">Thinking...</span>
                        </div>
                    `;
                    messagesContainer.appendChild(row);
                    scrollToBottom();
                    return id;
                }

                function removeMessageElement(id) {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                }

                function scrollToBottom() {
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }

                function clearChat() {
                    AIState.history = [];
                    if (!messagesContainer) return;
                    messagesContainer.innerHTML = `
                        <div class="flex items-start gap-2.5">
                            <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-emerald-200">
                                <i class="fa-solid fa-robot"></i>
                            </div>
                            <div class="bg-white border border-gray-200/80 rounded-2xl rounded-tl-none p-3 shadow-sm text-xs text-gray-800 leading-relaxed max-w-[88%] space-y-2">
                                <p>Chat cleared! How can I assist you with your leaves, balances, or company policies today?</p>
                                <div class="pt-1.5 border-t border-gray-100 text-[11px] text-gray-500 flex items-center gap-1">
                                    <i class="fa-solid fa-shield-halved text-emerald-600"></i>
                                    <span>Responses are strictly tailored to your role.</span>
                                </div>
                            </div>
                        </div>
                    `;
                    syncRoleUI();
                }

                function escapeHTML(str) {
                    if (str === null || str === undefined) return '';
                    return String(str)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
                }

                function escapeAttr(str) {
                    if (str === null || str === undefined) return '';
                    return String(str)
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }

                function formatAIMarkdown(text) {
                    if (!text) return '';
                    let html = escapeHTML(text);

                    // Code blocks
                    html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, function (match, lang, code) {
                        return `<pre class="bg-slate-900 text-slate-100 p-2.5 rounded-lg my-1.5 overflow-x-auto text-[11px] font-mono leading-tight"><code>${code.trim()}</code></pre>`;
                    });

                    // Inline code
                    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-emerald-800 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');

                    // Markdown Tables: parse rows like | A | B | C |
                    html = html.replace(/((?:^\|.+?\|(?:\r?\n|$))+)/gm, function (tableBlock) {
                        const rows = tableBlock.trim().split(/\r?\n/).filter(r => r.trim().startsWith('|'));
                        if (rows.length < 2) return tableBlock;
                        let tableHtml = '<div class="overflow-x-auto my-2 rounded-xl border border-gray-200 shadow-2xs"><table class="w-full text-left border-collapse text-[11px]">';
                        let isHeader = true;
                        rows.forEach((row, idx) => {
                            if (/^\|[\s\-:|]+\|$/.test(row.trim())) {
                                isHeader = false;
                                return;
                            }
                            const cells = row.split('|').slice(1, -1).map(c => c.trim());
                            if (idx === 0 || isHeader) {
                                tableHtml += '<thead class="bg-slate-100/80 text-slate-800 font-semibold border-b border-gray-200"><tr>';
                                cells.forEach(cell => {
                                    tableHtml += `<th class="px-2.5 py-1.5 whitespace-nowrap">${cell}</th>`;
                                });
                                tableHtml += '</tr></thead><tbody class="divide-y divide-gray-100 bg-white">';
                                isHeader = false;
                            } else {
                                tableHtml += '<tr class="hover:bg-slate-50/70 transition-colors">';
                                cells.forEach(cell => {
                                    tableHtml += `<td class="px-2.5 py-1.5 whitespace-nowrap text-gray-700">${cell}</td>`;
                                });
                                tableHtml += '</tr>';
                            }
                        });
                        tableHtml += '</tbody></table></div>';
                        return tableHtml;
                    });

                    // Blockquotes
                    html = html.replace(/^>\s*(.*)$/gim, '<blockquote class="border-l-2 border-emerald-500 bg-emerald-50/60 pl-2.5 py-1 my-1.5 text-slate-700 rounded-r text-[11px] italic">$1</blockquote>');

                    // Headers
                    html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-xs text-gray-900 mt-2 mb-1 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>$1</h4>');
                    html = html.replace(/^## (.*$)/gim, '<h3 class="font-bold text-sm text-gray-950 mt-2.5 mb-1">$1</h3>');
                    html = html.replace(/^# (.*$)/gim, '<h2 class="font-bold text-sm text-gray-950 mt-3 mb-1">$1</h2>');

                    // Bold
                    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
                    html = html.replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>');

                    // Italics
                    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
                    html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

                    // Numbered lists
                    html = html.replace(/^\s*(\d+)\.\s+(.*)$/gim, '<div class="flex items-start gap-1.5 my-0.5"><span class="text-emerald-700 font-bold text-[11px] flex-shrink-0">$1.</span><span class="flex-1">$2</span></div>');

                    // Bullet lists
                    html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<div class="flex items-start gap-1.5 my-0.5"><span class="text-emerald-600 font-bold text-xs flex-shrink-0">•</span><span class="flex-1">$1</span></div>');

                    // Double line breaks into paragraphs
                    html = html.replace(/\n\n+/g, '<div class="h-1.5"></div>');
                    html = html.replace(/\n/g, '<br>');

                    // Action triggers: turn mentions of app tabs into clickable action buttons
                    html = html.replace(/(['"]?Apply for Leave['"]?|['"]?Apply Leave['"]?)/gi, '<button type="button" class="ai-action-link inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-all active:scale-95 my-0.5 cursor-pointer" data-action="applyLeave"><i class="fa-solid fa-calendar-plus text-[10px]"></i>$1</button>');
                    html = html.replace(/(['"]?My Applications['"]?)/gi, '<button type="button" class="ai-action-link inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-all active:scale-95 my-0.5 cursor-pointer" data-action="myApplications"><i class="fa-solid fa-file-alt text-[10px]"></i>$1</button>');
                    html = html.replace(/(['"]?My Balance['"]?|['"]?Leave Balance['"]?)/gi, '<button type="button" class="ai-action-link inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-all active:scale-95 my-0.5 cursor-pointer" data-action="myBalance"><i class="fa-solid fa-chart-pie text-[10px]"></i>$1</button>');
                    html = html.replace(/(['"]?Team Applications['"]?)/gi, '<button type="button" class="ai-action-link inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-all active:scale-95 my-0.5 cursor-pointer" data-action="teamApplications"><i class="fa-solid fa-users text-[10px]"></i>$1</button>');
                    html = html.replace(/(['"]?Holiday Calendar['"]?|['"]?Calendar['"]?)/gi, '<button type="button" class="ai-action-link inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-all active:scale-95 my-0.5 cursor-pointer" data-action="calendar"><i class="fa-solid fa-calendar-day text-[10px]"></i>$1</button>');
                    html = html.replace(/(['"]?Reports['"]?)/gi, '<button type="button" class="ai-action-link inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-all active:scale-95 my-0.5 cursor-pointer" data-action="reports"><i class="fa-solid fa-chart-line text-[10px]"></i>$1</button>');

                    return html;
                }

                function openApiKeyModal() {
                    if (!apiKeyModal) return;
                    apiKeyModal.classList.remove('hidden');
                    if (apiKeyStatusMsg) apiKeyStatusMsg.classList.add('hidden');
                    if (apiKeyInput) {
                        apiKeyInput.value = '';
                        setTimeout(() => apiKeyInput.focus(), 150);
                    }
                }

                function closeApiKeyModal() {
                    if (apiKeyModal) apiKeyModal.classList.add('hidden');
                }

                function handleSaveApiKey() {
                    if (!apiKeyInput || !apiKeyInput.value.trim()) {
                        showApiKeyStatus('error', 'Please enter a valid Gemini API Key');
                        return;
                    }
                    const key = apiKeyInput.value.trim();
                    if (saveApiKeyBtn) {
                        saveApiKeyBtn.disabled = true;
                        saveApiKeyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
                    }

                    callGoogleScriptFunction('apiSetGeminiApiKey', { apiKey: key }, 45000)
                        .then(res => {
                            if (saveApiKeyBtn) {
                                saveApiKeyBtn.disabled = false;
                                saveApiKeyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save & Verify Key';
                            }
                            showApiKeyStatus('success', 'Gemini API Key verified and saved successfully!');
                            AIState.isConfigured = true;
                            setTimeout(() => {
                                closeApiKeyModal();
                                appendAssistantMessage('🎉 **Google Gemini AI has been successfully connected!** You can now ask any question about your leave balances, policies, or application status.');
                            }, 1200);
                        })
                        .catch(err => {
                            if (saveApiKeyBtn) {
                                saveApiKeyBtn.disabled = false;
                                saveApiKeyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save & Verify Key';
                            }
                            showApiKeyStatus('error', err.message || 'Key validation failed');
                        });
                }

                function showApiKeyStatus(type, msg) {
                    if (!apiKeyStatusMsg) return;
                    apiKeyStatusMsg.classList.remove('hidden');
                    if (type === 'success') {
                        apiKeyStatusMsg.className = 'text-xs p-2.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium';
                    } else {
                        apiKeyStatusMsg.className = 'text-xs p-2.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 font-medium';
                    }
                    apiKeyStatusMsg.textContent = msg;
                }

                function init() {
                    initElements();
                    bindEvents();
                    syncRoleUI();

                    // Periodic check to re-sync if userRole loads after DOMContentLoaded
                    let attempts = 0;
                    const interval = setInterval(() => {
                        attempts++;
                        if (AppState && AppState.userRole && AppState.userRole !== AIState.userRole) {
                            syncRoleUI();
                        }
                        if (attempts > 10) clearInterval(interval);
                    }, 1000);
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', init);
                } else {
                    init();
                }
            })();
        