document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } else {
                alert('Geçersiz e-posta veya şifre');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const userName = document.getElementById('registerName').value;
            const userEmail = document.getElementById('registerEmail').value;
            const userPassword = document.getElementById('registerPassword').value;
            const userPhoto = document.getElementById('registerPhoto').files[0];
            const userRole = document.getElementById('registerRole').value;

            const reader = new FileReader();
            reader.onloadend = function() {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                users.push({ name: userName, email: userEmail, password: userPassword, photo: reader.result, role: userRole });
                localStorage.setItem('users', JSON.stringify(users));
                window.location.href = 'login.html';
            };

            if (userPhoto) {
                reader.readAsDataURL(userPhoto);
            } else {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                users.push({ name: userName, email: userEmail, password: userPassword, photo: 'placeholder.jpg', role: userRole });
                localStorage.setItem('users', JSON.stringify(users));
                window.location.href = 'login.html';
            }
        });
    }

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const members = JSON.parse(localStorage.getItem('members')) || [];
    const holidays = JSON.parse(localStorage.getItem('holidays')) || {};
    let currentEditIndex = null;
    let editHolidayIndex = null;
    let workloadChart;

    function saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    const modals = document.querySelectorAll('.modal');
    const openCreateTaskModalButton = document.getElementById('openCreateTaskModal');
    const closeCreateTaskModalButton = document.getElementById('closeCreateTaskModal');
    const createTaskModal = document.getElementById('createTaskModal');
    const openAddMemberModalButton = document.getElementById('openAddMemberModal');
    const closeAddMemberModalButton = document.getElementById('closeAddMemberModal');
    const addMemberModal = document.getElementById('addMemberModal');
    const openDeleteMemberModalButton = document.getElementById('openDeleteMemberModal');
    const closeDeleteMemberModalButton = document.getElementById('closeDeleteMemberModal');
    const deleteMemberModal = document.getElementById('deleteMemberModal');
    const openAddHolidayModalButton = document.getElementById('openAddHolidayModal');
    const closeAddHolidayModalButton = document.getElementById('closeAddHolidayModal');
    const addHolidayModal = document.getElementById('addHolidayModal');

    if (openCreateTaskModalButton && closeCreateTaskModalButton && createTaskModal) {
        openCreateTaskModalButton.addEventListener('click', () => {
            createTaskModal.style.display = 'block';
            currentEditIndex = null;
        });
        closeCreateTaskModalButton.addEventListener('click', () => createTaskModal.style.display = 'none');
    }

    if (openAddMemberModalButton && closeAddMemberModalButton && addMemberModal) {
        openAddMemberModalButton.addEventListener('click', () => addMemberModal.style.display = 'block');
        closeAddMemberModalButton.addEventListener('click', () => addMemberModal.style.display = 'none');
    }

    if (openDeleteMemberModalButton && closeDeleteMemberModalButton && deleteMemberModal) {
        openDeleteMemberModalButton.addEventListener('click', () => deleteMemberModal.style.display = 'block');
        closeDeleteMemberModalButton.addEventListener('click', () => deleteMemberModal.style.display = 'none');
    }

    if (openAddHolidayModalButton && closeAddHolidayModalButton && addHolidayModal) {
        openAddHolidayModalButton.addEventListener('click', () => {
            addHolidayModal.style.display = 'block';
            loadHolidays();
        });
        closeAddHolidayModalButton.addEventListener('click', () => {
            addHolidayModal.style.display = 'none';
            editHolidayIndex = null;
        });
    }

    window.onclick = function(event) {
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = 'none';
                editHolidayIndex = null;
            }
        });
    };

    function loadMembers() {
        const taskMembersSelect = document.getElementById('taskMembers');
        const deleteMemberSelect = document.getElementById('deleteMemberSelect');
        const holidayMemberSelect = document.getElementById('holidayMemberSelect');

        if (taskMembersSelect && deleteMemberSelect && holidayMemberSelect) {
            taskMembersSelect.innerHTML = '';
            deleteMemberSelect.innerHTML = '';
            holidayMemberSelect.innerHTML = '';

            members.forEach(member => {
                const option = document.createElement('option');
                option.value = member.name;
                option.textContent = member.name;
                taskMembersSelect.appendChild(option);

                const deleteOption = option.cloneNode(true);
                deleteMemberSelect.appendChild(deleteOption);

                const holidayOption = option.cloneNode(true);
                holidayMemberSelect.appendChild(holidayOption);
            });
        }
    }

    loadMembers();

    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const newMember = {
                name: document.getElementById('memberName').value,
                email: document.getElementById('memberEmail').value,
                role: document.getElementById('memberRole').value,
                photo: document.getElementById('memberPhoto').files[0] ? URL.createObjectURL(document.getElementById('memberPhoto').files[0]) : 'placeholder.jpg'
            };

            members.push(newMember);
            saveData('members', members);
            loadMembers();
            addMemberModal.style.display = 'none';
        });
    }

    const deleteMemberButton = document.getElementById('deleteMemberButton');
    if (deleteMemberButton) {
        deleteMemberButton.addEventListener('click', function(event) {
            event.preventDefault();

            const memberName = document.getElementById('deleteMemberSelect').value;
            const memberIndex = members.findIndex(member => member.name === memberName);

            if (memberIndex !== -1) {
                members.splice(memberIndex, 1);
                saveData('members', members);
                loadMembers();
                deleteMemberModal.style.display = 'none';
            } else {
                alert('Üye bulunamadı');
            }
        });
    }

    const addHolidayForm = document.getElementById('addHolidayForm');
    if (addHolidayForm) {
        addHolidayForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const memberName = document.getElementById('holidayMemberSelect').value;
            const holidayStart = new Date(document.getElementById('holidayStartDate').value);
            const holidayEnd = new Date(document.getElementById('holidayEndDate').value);

            if (!holidays[memberName]) {
                holidays[memberName] = [];
            }

            if (editHolidayIndex !== null) {
                holidays[memberName].splice(editHolidayIndex, 1);
                editHolidayIndex = null;
            }

            holidays[memberName].push({ start: holidayStart.toISOString(), end: holidayEnd.toISOString() });

            saveData('holidays', holidays);
            addHolidayModal.style.display = 'none';

            tasks.forEach(task => {
                if (task.members.includes(memberName)) {
                    task.workdays = calculateWorkdays(new Date(task.startDate), new Date(task.endDate), task.members);
                }
            });
            saveData('tasks', tasks);
            listTasks();
            calculatePerformance();
            loadHolidays();
        });
    }

    function loadHolidays() {
        const holidayList = document.getElementById('holidayList').getElementsByTagName('tbody')[0];
        holidayList.innerHTML = '';

        for (const memberName in holidays) {
            if (Array.isArray(holidays[memberName])) {
                holidays[memberName].forEach((holiday, index) => {
                    const holidayStart = new Date(holiday.start).toLocaleDateString('tr-TR');
                    const holidayEnd = new Date(holiday.end).toLocaleDateString('tr-TR');
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${memberName}</td>
                        <td>${holidayStart}</td>
                        <td>${holidayEnd}</td>
                        <td>
                            <button onclick="editHoliday('${memberName}', ${index})">Düzenle</button>
                            <button onclick="deleteHoliday('${memberName}', ${index})">Sil</button>
                        </td>
                    `;
                    holidayList.appendChild(row);
                });
            }
        }
    }

    window.editHoliday = function(memberName, index) {
        const holiday = holidays[memberName][index];
        const holidayStart = new Date(holiday.start).toISOString().split('T')[0];
        const holidayEnd = new Date(holiday.end).toISOString().split('T')[0];
        document.getElementById('holidayMemberSelect').value = memberName;
        document.getElementById('holidayStartDate').value = holidayStart;
        document.getElementById('holidayEndDate').value = holidayEnd;
        addHolidayModal.style.display = 'block';
        editHolidayIndex = index;
    };

    window.deleteHoliday = function(memberName, index) {
        holidays[memberName].splice(index, 1);
        if (holidays[memberName].length === 0) {
            delete holidays[memberName];
        }
        saveData('holidays', holidays);
        loadHolidays();

        tasks.forEach(task => {
            if (task.members.includes(memberName)) {
                task.workdays = calculateWorkdays(new Date(task.startDate), new Date(task.endDate), task.members);
            }
        });
        saveData('tasks', tasks);
        listTasks();
        calculatePerformance();
    };

    const createTaskForm = document.getElementById('createTaskForm');
    if (createTaskForm) {
        createTaskForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const taskTitle = document.getElementById('taskTitle').value;
            const taskDescription = document.getElementById('taskDescription').value;
            const taskStartDate = new Date(document.getElementById('taskStartDate').value);
            const taskEndDate = new Date(document.getElementById('taskEndDate').value);
            const taskType = document.getElementById('taskType').value;
            const taskPages = parseInt(document.getElementById('taskPages').value, 10);
            const taskMembers = Array.from(document.getElementById('taskMembers').selectedOptions).map(option => option.value);
            const taskPriority = document.getElementById('taskPriority').value;

            // Belirli metin türleri için günlük çeviri kapasitesi
            const translationCapacity = {
                "normal": 7,
                "Teknik Metin":2,
                "normal_kitap":3.5,
                "teknik_kitap":1,
                // Diğer metin türleri için kapasite ekleyin
            };

            const dailyCapacity = translationCapacity[taskType] || 7; // Varsayılan günlük kapasite

            // İş günlerini hesapla
            const businessDays = getBusinessDays(taskStartDate, taskEndDate);

            // Gerekli gün sayısını hesapla
            const requiredDays = Math.ceil(taskPages / dailyCapacity);

            if (requiredDays > businessDays) {
                alert(`Bu çeviri için en az ${requiredDays} iş günü vermelisiniz veya daha fazla tercüman atamalısınız.`);
                return;
            }

            const newTask = {
                title: taskTitle,
                description: taskDescription,
                startDate: taskStartDate.toISOString().split('T')[0],
                endDate: taskEndDate.toISOString().split('T')[0],
                type: taskType,
                pages: taskPages,
                members: taskMembers,
                priority: taskPriority,
                workdays: calculateWorkdays(taskStartDate, taskEndDate, taskMembers)
            };

            if (currentEditIndex !== null) {
                tasks[currentEditIndex] = newTask;
            } else {
                tasks.push(newTask);
            }

            saveData('tasks', tasks);
            createTaskModal.style.display = 'none';
            listTasks();
            calculatePerformance();
        });
    }

    function getBusinessDays(startDate, endDate) {
        let count = 0;
        const curDate = new Date(startDate);
        while (curDate <= endDate) {
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    }

    const taskList = document.getElementById('taskList');
    function listTasks() {
        if (taskList) {
            taskList.innerHTML = '';

            tasks.forEach((task, index) => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.innerHTML = `
                    <strong>${task.title}</strong>
                    <p>${task.description}</p>
                    <p>Tarih Aralığı: ${task.startDate} - ${task.endDate}</p>
                    <p>Tercümanlar: ${task.members.join(', ')}</p>
                    <p>Öncelik: ${task.priority}</p>
                    <button onclick="editTask(${index})">Düzenle</button>
                    <button onclick="deleteTask(${index})">Sil</button>
                `;
                taskList.appendChild(taskItem);
            });
        }
    }

    listTasks();

    window.editTask = function(index) {
        const task = tasks[index];
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskStartDate').value = task.startDate;
        document.getElementById('taskEndDate').value = task.endDate;
        document.getElementById('taskType').value = task.type;
        document.getElementById('taskPages').value = task.pages;
        Array.from(document.getElementById('taskMembers').options).forEach(option => {
            option.selected = task.members.includes(option.value);
        });
        document.getElementById('taskPriority').value = task.priority;
        createTaskModal.style.display = 'block';

        currentEditIndex = index;
    };

    window.deleteTask = function(index) {
        tasks.splice(index, 1);
        saveData('tasks', tasks);
        listTasks();
        calculatePerformance();
    };

    function createChart(translatorNames, translatorWorkloads, translatorColors) {
        const ctx = document.getElementById('workloadChart').getContext('2d');
        workloadChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: translatorNames,
                datasets: [{
                    label: 'İş Yükü (Sayfa)',
                    data: translatorWorkloads,
                    backgroundColor: translatorColors,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function updateChart(translatorNames, translatorWorkloads, translatorColors) {
        workloadChart.data.labels = translatorNames;
        workloadChart.data.datasets[0].data = translatorWorkloads;
        workloadChart.data.datasets[0].backgroundColor = translatorColors;
        workloadChart.update();
    }

    function calculatePerformance() {
        const performanceTableBody = document.querySelector('#performanceTable tbody');
        const translatorNames = [];
        const translatorWorkloads = [];
        const translatorColors = [];

        const dailyEffectiveMinutes = 280; // Günlük efektif çalışma süresi (dakika)

        // Belirli metin türleri için günlük çeviri kapasitesi
        const translationCapacity = {
            "normal": 7,
            "Teknik Metin": 2,
            "normal_kitap": 3.5,
            "teknik_kitap": 1,
            // Diğer metin türleri için kapasite ekleyin
        };

        if (performanceTableBody) {
            performanceTableBody.innerHTML = '';

            tasks.forEach(task => {
                const taskType = task.type; // Görev türü
                const dailyCapacity = translationCapacity[taskType] || 7; // Varsayılan günlük kapasite

                const workloadDistribution = distributeWorkload(task.pages, task.members, dailyCapacity); // Günlük kotayı buradan alıyoruz

                workloadDistribution.forEach(translator => {
                    const percentageWorkload = ((translator.pages / task.pages) * 100).toFixed(2);
                    const dailyQuotaStr = `Çevrilecek Sayfa: ${translator.pages} / Günlük Çeviri Kotası: ${dailyCapacity}`;
                    const workdaysStr = `${translator.workdays} gün / ${task.workdays} gün`;

                    // Efektif saat hesaplaması
                    const totalEffectiveMinutes = translator.workdays * dailyEffectiveMinutes;
                    const effectiveHours = (totalEffectiveMinutes / 60).toFixed(2); // Dakikayı saate çevirme

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${translator.name}</td>
                        <td>${task.title}</td>
                        <td>${task.startDate} - ${task.endDate}</td>
                        <td>${task.priority}</td>
                        <td>${task.type}</td> <!-- İşin türü buraya ekleniyor -->
                        <td>${dailyQuotaStr}</td>
                        <td>${percentageWorkload}%</td>
                        <td>${effectiveHours} saat</td>
                        <td>${translator.workdays} gün</td>
                        <td>${workdaysStr}</td>
                    `;
                    performanceTableBody.appendChild(row);

                    // Grafik için veri ekleme
                    if (!translatorNames.includes(translator.name)) {
                        translatorNames.push(translator.name);
                        translatorWorkloads.push(translator.pages);
                        translatorColors.push(`hsl(${translatorNames.length * 40}, 70%, 50%)`); // Farklı renkler
                    } else {
                        const index = translatorNames.indexOf(translator.name);
                        translatorWorkloads[index] += translator.pages;
                    }
                });
            });
        }

        if (workloadChart) {
            updateChart(translatorNames, translatorWorkloads, translatorColors);
        } else {
            createChart(translatorNames, translatorWorkloads, translatorColors);
        }
    }

    function distributeWorkload(totalPages, translators, dailyQuota) {
        let basePagesPerTranslator = Math.floor(totalPages / translators.length);
        let remainderPages = totalPages % translators.length;

        let workloadDistribution = translators.map(translator => {
            return { name: translator, pages: basePagesPerTranslator, holidays: getHolidays(translator) };
        });

        // Distribute the remainder pages
        for (let i = 0; i < remainderPages; i++) {
            workloadDistribution[i].pages++;
        }

        // Calculate workdays based on daily quota and holidays
        workloadDistribution.forEach(translator => {
            const effectiveDays = calculateEffectiveDays(translator.holidays);
            translator.workdays = Math.ceil(translator.pages / dailyQuota) - effectiveDays;
        });

        // Adjust the workload for translators with holidays
        adjustForHolidays(workloadDistribution, dailyQuota);

        return workloadDistribution;
    }

    function getHolidays(translator) {
        return holidays[translator] || [];
    }

    function calculateEffectiveDays(holidays) {
        let effectiveDays = 0;
        holidays.forEach(holiday => {
            const holidayStart = new Date(holiday.start);
            const holidayEnd = new Date(holiday.end);
            for (let date = holidayStart; date <= holidayEnd; date.setDate(date.getDate() + 1)) {
                if (date.getDay() !== 0 && date.getDay() !== 6) { // Exclude weekends
                    effectiveDays++;
                }
            }
        });
        return effectiveDays;
    }

    function adjustForHolidays(workloadDistribution, dailyQuota) {
        workloadDistribution.forEach(translator => {
            let availableDays = Math.max(translator.workdays, 0);
            let possiblePages = availableDays * dailyQuota;
            if (translator.pages > possiblePages) {
                let excessPages = translator.pages - possiblePages;
                translator.pages = possiblePages;

                let otherTranslators = workloadDistribution.filter(t => t.name !== translator.name);
                otherTranslators.forEach(t => {
                    t.pages += Math.ceil(excessPages / otherTranslators.length);
                });
            }
        });

        workloadDistribution.forEach(translator => {
            translator.workdays = Math.ceil(translator.pages / dailyQuota);
        });
    }

    calculatePerformance();

    function calculateWorkdays(startDate, endDate, members) {
        let totalWorkdays = 0;
        let memberWorkdays = {};

        const memberHolidays = {};
        members.forEach(member => {
            memberHolidays[member] = holidays[member] || [];
        });

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const day = date.getDay();
            const isWeekend = (day === 0 || day === 6);
            const isHoliday = members.some(member => {
                return memberHolidays[member].some(holiday => new Date(holiday.start).toDateString() === date.toDateString());
            });

            if (!isWeekend && !isHoliday) {
                totalWorkdays++;
                members.forEach(member => {
                    if (!memberWorkdays[member]) memberWorkdays[member] = 0;
                    if (!memberHolidays[member].some(holiday => new Date(holiday.start).toDateString() === date.toDateString())) {
                        memberWorkdays[member]++;
                    }
                });
            }
        }

        const totalMemberWorkdays = Object.values(memberWorkdays).reduce((a, b) => a + b, 0);
        const remainingWorkdays = totalWorkdays - totalMemberWorkdays;
        const workdaysPerMember = Math.floor(remainingWorkdays / members.length);

        members.forEach(member => {
            memberWorkdays[member] += workdaysPerMember;
        });

        return totalWorkdays;
    }

    function distributeWorkdays(totalWorkdays, members) {
        const memberWorkdays = {};
        const daysPerMember = Math.floor(totalWorkdays / members.length);
        const extraDays = totalWorkdays % members.length;

        members.forEach((member, index) => {
            memberWorkdays[member] = daysPerMember + (index < extraDays ? 1 : 0);
        });

        members.forEach(member => {
            const memberHolidays = holidays[member] || [];
            memberWorkdays[member] -= memberHolidays.length;
            const additionalDays = memberHolidays.length;
            members.forEach(otherMember => {
                if (otherMember !== member) {
                    memberWorkdays[otherMember] += additionalDays / (members.length - 1);
                }
            });
        });

        return memberWorkdays;
    }

    listTasks();

    const userName = document.getElementById('userName');
    const userPhoto = document.getElementById('userPhoto');
    const currentDate = document.getElementById('currentDate');

    if (userName && userPhoto && currentDate) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { name: 'Kullanıcı Adı', photo: 'placeholder.jpg' };

        userName.textContent = currentUser.name;
        userPhoto.src = currentUser.photo;

        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        currentDate.textContent = today.toLocaleDateString('tr-TR', options);
    }
});
