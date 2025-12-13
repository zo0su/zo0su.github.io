// Apps Script 웹 앱 URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxc7ljV5q4j3Yt2YlkJ332vsPBBtr0rl2Ni9kmrJkp1Z-_PMEeBZAWMJrPlnZsULmjw3w/exec';
const ADMIN_PASSWORD = '1234';

// 화면 전환 함수
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// 전화번호 포맷팅 (010-1234-5678)
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
}

// 전화번호로 중복 체크
async function checkDuplicate(phone) {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getAll`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.members) {
                const cleanedPhone = phone.replace(/\D/g, '');
                return data.members.some(member => {
                    const memberPhone = member[4] ? member[4].replace(/\D/g, '') : '';
                    return memberPhone === cleanedPhone;
                });
            }
        }
    } catch (error) {
        console.error('중복 체크 오류:', error);
    }
    return false;
}

// 모든 회원 데이터 가져오기
async function getAllMembers() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getAll`);
        if (response.ok) {
            const data = await response.json();
            return data.success ? data.members : [];
        }
    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
    }
    return [];
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    // 메인 화면 버튼들
    document.getElementById('registerBtn').addEventListener('click', () => {
        document.getElementById('membershipForm').reset();
        showScreen('registerScreen');
    });

    document.getElementById('listBtn').addEventListener('click', async () => {
        await loadMemberList();
        showScreen('listScreen');
    });

    document.getElementById('adminBtn').addEventListener('click', () => {
        document.getElementById('adminPassword').value = '';
        showScreen('adminPasswordScreen');
    });

    // 등록 화면 취소 버튼
    document.getElementById('cancelRegisterBtn').addEventListener('click', () => {
        showScreen('mainScreen');
    });

    // 관리자 비밀번호 화면
    document.getElementById('adminLoginBtn').addEventListener('click', () => {
        const password = document.getElementById('adminPassword').value;
        if (password === ADMIN_PASSWORD) {
            loadAdminData();
            showScreen('adminScreen');
        } else {
            alert('비밀번호가 올바르지 않습니다.');
        }
    });

    document.getElementById('cancelAdminBtn').addEventListener('click', () => {
        showScreen('mainScreen');
    });

    // 관리자 화면
    document.getElementById('refreshDataBtn').addEventListener('click', () => {
        loadAdminData();
    });

    document.getElementById('downloadCsvBtn').addEventListener('click', () => {
        downloadCSV();
    });

    document.getElementById('backToAdminMainBtn').addEventListener('click', () => {
        showScreen('mainScreen');
    });

    // 확인 화면
    document.getElementById('backToMainBtn').addEventListener('click', () => {
        showScreen('mainScreen');
    });

    // 리스트 화면
    document.getElementById('backToListBtn').addEventListener('click', () => {
        showScreen('mainScreen');
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
});

// 폼 제출 처리
async function handleFormSubmit() {
    const form = document.getElementById('membershipForm');
    const formData = new FormData(form);
    
    // 전화번호 유효성 검사
    const phone = formData.get('phone');
    const phoneCleaned = phone.replace(/\D/g, '');
    if (phoneCleaned.length !== 11 || !phoneCleaned.startsWith('010')) {
        alert('휴대전화 번호를 올바르게 입력하세요. (010으로 시작하는 11자리 숫자)');
        return;
    }

    // 중복 체크
    const isDuplicate = await checkDuplicate(phone);
    if (isDuplicate) {
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
    try {
        // Google Apps Script는 POST 요청에 대해 리다이렉트를 수행하므로
        // 먼저 데이터를 전송하고, 성공으로 간주하여 확인 화면 표시
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).catch(() => {
            // 네트워크 오류는 무시 (Apps Script의 리다이렉트 특성상)
        });

        // 데이터 전송 후 확인 화면 표시
        showConfirmScreen(data);
    } catch (error) {
        console.error('제출 오류:', error);
        alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 확인 화면 표시
function showConfirmScreen(data) {
    const confirmContent = document.getElementById('confirmContent');
    confirmContent.innerHTML = `
        <p><strong>성명:</strong> ${data.name}</p>
        <p><strong>소속교육청:</strong> ${data.educationOffice}</p>
        <p><strong>2026년도 학교:</strong> ${data.school2026}</p>
        <p><strong>파트:</strong> ${data.part}</p>
        <p><strong>휴대전화:</strong> ${data.phone}</p>
        <p><strong>차량번호:</strong> ${data.carNumber}</p>
        <p><strong>차량요일제:</strong> ${data.carDay}</p>
        <p><strong>2026년 파트직책:</strong> ${data.partPosition2026}</p>
        <p><strong>입단시기:</strong> ${data.joinDate}</p>
        <div class="message success" style="margin-top: 20px;">
            연습일에 뵙겠습니다.
        </div>
    `;
    showScreen('confirmScreen');
}

// 단원 리스트 로드
async function loadMemberList() {
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '<div class="loading">로딩 중...</div>';

    const members = await getAllMembers();
    
    if (members.length === 0) {
        memberList.innerHTML = '<p style="text-align: center; padding: 20px;">등록된 단원이 없습니다.</p>';
        return;
    }

    memberList.innerHTML = members.map((member, index) => {
        // member 배열: [성명, 소속교육청, 2026년도학교, 파트, 휴대전화, ...]
        const name = member[0] || '';
        const part = member[3] || '';
        return `
            <div class="member-item">
                <div class="member-name">${name}</div>
                <div class="member-part">${part}</div>
            </div>
        `;
    }).join('');
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

    let tableHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>번호</th>
                    <th>성명</th>
                    <th>소속교육청</th>
                    <th>2026년도 학교</th>
                    <th>파트</th>
                    <th>휴대전화</th>
                    <th>차량번호</th>
                    <th>차량요일제</th>
                    <th>2026년 파트직책</th>
                    <th>입단시기</th>
                </tr>
            </thead>
            <tbody>
    `;

    members.forEach((member, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${member[0] || ''}</td>
                <td>${member[1] || ''}</td>
                <td>${member[2] || ''}</td>
                <td>${member[3] || ''}</td>
                <td>${member[4] || ''}</td>
                <td>${member[5] || ''}</td>
                <td>${member[6] || ''}</td>
                <td>${member[7] || ''}</td>
                <td>${member[8] || ''}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    adminData.innerHTML = tableHTML;
}

// CSV 다운로드
async function downloadCSV() {
    const members = await getAllMembers();
    
    if (members.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
    }

    // CSV 헤더
    const headers = ['성명', '소속교육청', '2026년도 학교', '파트', '휴대전화', '차량번호', '차량요일제', '2026년 파트직책', '입단시기'];
    
    // CSV 데이터 생성
    let csvContent = '\uFEFF' + headers.join(',') + '\n'; // BOM 추가 (한글 깨짐 방지)
    
    members.forEach(member => {
        const row = member.map(cell => {
            // 쉼표나 따옴표가 있으면 따옴표로 감싸기
            const cellValue = cell || '';
            if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
                return '"' + cellValue.replace(/"/g, '""') + '"';
            }
            return cellValue;
        });
        csvContent += row.join(',') + '\n';
    });

    // Blob 생성 및 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `btoMembership_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

