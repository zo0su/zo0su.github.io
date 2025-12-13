// Apps Script 웹 앱 URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9xi5a9s-p6_U9UrT8h34SqcuWiruCWf3sNavw2Z-qQGhhr5iFg09sJJXmw0kNkbp6qw/exec';
const ADMIN_PASSWORD = '1234';

// 화면 전환
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

// 전화번호 포맷팅 (010-1234-5678)
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 ? cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : phone;
}

// 전화번호 실시간 하이픈 포맷팅
function setupPhoneNumberFormatter() {
    const input = document.getElementById('phone');
    if (!input) return;
    
    input.addEventListener('input', function(e) {
        const inputEl = e.target;
        const cursorPos = inputEl.selectionStart;
        const oldValue = inputEl.value;
        let value = oldValue.replace(/\D/g, '').slice(0, 11);
        let formatted = value;
        
        if (value.length > 7) formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
        else if (value.length > 3) formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
        
        if (oldValue !== formatted) {
            inputEl.value = formatted;
            const beforeDash = oldValue.substring(0, cursorPos).replace(/\D/g, '').length;
            let newPos = cursorPos;
            if (beforeDash === 3 && value.length > 3) newPos++;
            else if (beforeDash === 7 && value.length > 7) newPos++;
            setTimeout(() => inputEl.setSelectionRange(Math.min(newPos, formatted.length), Math.min(newPos, formatted.length)), 0);
        }
    });
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && e.target.selectionStart > 0 && e.target.value[e.target.selectionStart - 1] === '-') {
            e.preventDefault();
            const pos = e.target.selectionStart - 2;
            e.target.value = e.target.value.substring(0, pos) + e.target.value.substring(e.target.selectionStart);
            e.target.setSelectionRange(pos, pos);
        }
    });
}

// 데이터 가져오기 (공통)
async function fetchData(action = 'getAll') {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=${action}`);
        if (response.ok) {
            const data = await response.json();
            return data.success ? (data.members || []) : [];
        }
    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
    }
    return [];
}

// 전화번호 중복 체크
async function checkDuplicate(phone) {
    const members = await fetchData();
    const cleaned = phone.replace(/\D/g, '');
    return members.some(m => (m[4] || '').replace(/\D/g, '') === cleaned);
}

// 모든 회원 데이터 가져오기
async function getAllMembers() {
    return await fetchData();
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    // 화면 전환 버튼들
    const screenButtons = {
        'registerBtn': () => { document.getElementById('membershipForm').reset(); showScreen('registerScreen'); },
        'listBtn': async () => { showScreen('listScreen'); await loadMemberList(); },
        'adminBtn': () => { document.getElementById('adminPassword').value = ''; showScreen('adminPasswordScreen'); },
        'cancelRegisterBtn': () => showScreen('mainScreen'),
        'cancelAdminBtn': () => showScreen('mainScreen'),
        'backToMainBtn': () => showScreen('mainScreen'),
        'backToListBtn': () => showScreen('mainScreen'),
        'backToAdminMainBtn': () => showScreen('mainScreen'),
        'refreshDataBtn': () => loadAdminData(),
        'downloadCsvBtn': () => downloadCSV()
    };
    
    Object.entries(screenButtons).forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
    });
    
    // 관리자 로그인
    document.getElementById('adminLoginBtn').addEventListener('click', async () => {
        if (document.getElementById('adminPassword').value === ADMIN_PASSWORD) {
            showScreen('adminScreen');
            await loadAdminData();
        } else {
            alert('비밀번호가 올바르지 않습니다.');
        }
    });
    
    // 중복 확인 모달
    document.getElementById('yesEditBtn').addEventListener('click', () => {
        document.getElementById('duplicateModal').classList.remove('active');
        showScreen('registerScreen');
    });
    document.getElementById('noEditBtn').addEventListener('click', () => {
        document.getElementById('duplicateModal').classList.remove('active');
        showScreen('mainScreen');
    });
    
    // 폼 제출
    document.getElementById('membershipForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit();
    });
    
    setupPhoneNumberFormatter();
});

// 폼 제출 처리
async function handleFormSubmit() {
    const form = document.getElementById('membershipForm');
    const formData = new FormData(form);
    const phone = formData.get('phone');
    const phoneCleaned = phone.replace(/\D/g, '');
    
    // 전화번호 유효성 검사
    if (phoneCleaned.length !== 11 || !phoneCleaned.startsWith('010')) {
        alert('휴대전화 번호를 올바르게 입력하세요. (010으로 시작하는 11자리 숫자)');
        return;
    }
    
    // 중복 체크
    if (await checkDuplicate(phone)) {
        document.getElementById('duplicateModal').classList.add('active');
        return;
    }
    
    // 데이터 준비
    const data = {
        name: formData.get('name'),
        educationOffice: formData.get('educationOffice'),
        school2026: formData.get('school2026'),
        part: formData.get('part'),
        phone: formatPhoneNumber(phone),
        carNumber: formData.get('carNumber'),
        carDay: formData.get('carDay'),
        partPosition2026: formData.get('partPosition2026'),
        joinDate: formData.get('joinDate')
    };
    
    // Apps Script로 전송
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '제출 중...';
    
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            redirect: 'follow'
        });
        
        let responseData;
        try {
            const text = await response.text();
            responseData = JSON.parse(text);
        } catch (e) {
            responseData = { success: false, error: '응답 파싱 오류: ' + e.message };
        }
        
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        
        if (responseData?.success) {
            showConfirmScreen(data);
            console.log('✅ 데이터 전송 성공:', responseData);
        } else {
            const errorMsg = responseData?.error || responseData?.message || (response.status ? `HTTP ${response.status}` : '알 수 없는 오류');
            console.error('❌ 데이터 전송 실패:', { status: response.status, response: responseData });
            alert(`데이터 저장에 실패했습니다.\n\n오류: ${errorMsg}\n\n브라우저 콘솔(F12)을 확인하거나 다시 시도해주세요.`);
        }
    } catch (error) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        console.error('❌ 제출 오류:', error);
        
        const errorMsg = (error.name === 'TypeError' && error.message.includes('fetch'))
            ? 'Apps Script 서버에 연결할 수 없습니다.\n\n확인 사항:\n1. Apps Script 웹앱이 "모든 사용자" 권한으로 배포되었는지 확인\n2. 인터넷 연결 확인\n3. 브라우저 콘솔(F12)에서 자세한 오류 확인'
            : `오류: ${error.message || error.toString()}`;
        alert(`제출 중 오류가 발생했습니다.\n\n${errorMsg}\n\n브라우저 개발자 도구(F12 > Console)를 확인하세요.`);
    }
}

// 확인 화면 표시
function showConfirmScreen(data) {
    const fields = ['성명', '소속교육청', '2026년도 학교', '파트', '휴대전화', '차량번호', '차량요일제', '2026년 파트직책', '입단시기'];
    const values = [data.name, data.educationOffice, data.school2026, data.part, data.phone, data.carNumber, data.carDay, data.partPosition2026, data.joinDate];
    
    document.getElementById('confirmContent').innerHTML = fields.map((f, i) => `<p><strong>${f}:</strong> ${values[i]}</p>`).join('') +
        '<div class="message success" style="margin-top: 20px;">연습일에 뵙겠습니다.</div>';
    showScreen('confirmScreen');
}

// 단원 리스트 로드
async function loadMemberList() {
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '<div class="loading">로딩 중...</div>';
    const members = await getAllMembers();
    memberList.innerHTML = members.length === 0 
        ? '<p style="text-align: center; padding: 20px;">등록된 단원이 없습니다.</p>'
        : members.map(m => `<div class="member-item"><div class="member-name">${m[0] || ''}</div><div class="member-part">${m[3] || ''}</div></div>`).join('');
}

// 관리자 데이터 로드
async function loadAdminData() {
    const adminData = document.getElementById('adminData');
    adminData.innerHTML = '<div class="loading">로딩 중...</div>';
    const members = await getAllMembers();
    
    if (members.length === 0) {
        adminData.innerHTML = '<p style="text-align: center; padding: 20px;">등록된 데이터가 없습니다.</p>';
        return;
    }
    
    const headers = ['번호', '성명', '소속교육청', '2026년도 학교', '파트', '휴대전화', '차량번호', '차량요일제', '2026년 파트직책', '입단시기'];
    const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const bodyRows = members.map((m, i) => `<tr><td>${i + 1}</td>${Array.from({length: 9}, (_, j) => `<td>${m[j] || ''}</td>`).join('')}</tr>`).join('');
    
    adminData.innerHTML = `<table class="admin-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
}

// CSV 다운로드
async function downloadCSV() {
    const members = await getAllMembers();
    if (members.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
    }
    
    const headers = ['성명', '소속교육청', '2026년도 학교', '파트', '휴대전화', '차량번호', '차량요일제', '2026년 파트직책', '입단시기'];
    const escapeCsv = (cell) => {
        const val = cell || '';
        return (val.includes(',') || val.includes('"') || val.includes('\n')) ? `"${val.replace(/"/g, '""')}"` : val;
    };
    
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + members.map(m => m.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `btoMembership_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
