// Apps Script 웹 앱 URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9xi5a9s-p6_U9UrT8h34SqcuWiruCWf3sNavw2Z-qQGhhr5iFg09sJJXmw0kNkbp6qw/exec';
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

// 영문을 한글로 변환 (한글 자판 기준, 차량번호용)
function convertEnglishToKorean(text) {
    // 차량번호에 자주 사용되는 한글 자판 매핑 (한글 두벌식 기준)
    // 예: 'th' → '소', 'tn' → '구', 'gk' → '하' 등
    const engToKorMap = {
        // 2자 조합 (가장 많이 사용)
        'th': '소', 'tn': '구', 'gk': '하',
        'dk': '아', 'qk': '바', 'tk': '사',
        'wk': '자', 'dj': '어', 'wj': '저',
        'sh': '노', 'dh': '오', 'eh': '도',
        'fh': '로', 'ah': '모', 'qh': '보',
        'gh': '호', 'wh': '주', 'rl': '고',
        'rt': '과', 'rb': '교',
        // 단일 문자 (한글 자판 기준)
        't': 'ㅅ', 'n': 'ㅜ', 'g': 'ㅎ',
        'd': 'ㅇ', 'q': 'ㅂ', 's': 'ㄴ',
        'w': 'ㅈ', 'e': 'ㄷ', 'r': 'ㄱ',
        'f': 'ㄹ', 'a': 'ㅁ', 'k': 'ㅏ',
        'h': 'ㅗ', 'j': 'ㅓ', 'y': 'ㅛ',
        'u': 'ㅕ', 'i': 'ㅑ', 'o': 'ㅐ',
        'p': 'ㅔ', 'l': 'ㅣ', 'z': 'ㅋ',
        'x': 'ㅌ', 'c': 'ㅊ', 'v': 'ㅍ',
        'b': 'ㅠ', 'm': 'ㅡ'
    };
    
    let result = '';
    let i = 0;
    
    while (i < text.length) {
        const char = text[i];
        
        // 숫자는 그대로 유지
        if (/\d/.test(char)) {
            result += char;
            i++;
            continue;
        }
        
        // 이미 한글이면 그대로 유지
        if (/[가-힣]/.test(char)) {
            result += char;
            i++;
            continue;
        }
        
        // 영문인 경우 한글로 변환
        if (/[a-zA-Z]/.test(char)) {
            // 2자 조합 먼저 시도
            let matched = false;
            if (i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1])) {
                const twoChar = (char + text[i + 1]).toLowerCase();
                if (engToKorMap[twoChar]) {
                    result += engToKorMap[twoChar];
                    i += 2;
                    matched = true;
                }
            }
            
            if (!matched) {
                // 단일 문자 변환 (한글 자판 자모)
                const lowerChar = char.toLowerCase();
                const korChar = engToKorMap[lowerChar];
                if (korChar) {
                    result += korChar;
                } else {
                    result += char; // 매핑 없는 경우 그대로
                }
                i++;
            }
        } else {
            // 특수문자 등은 그대로
            result += char;
            i++;
        }
    }
    
    return result;
}

// 차량번호 입력 시 영문을 한글로 변환
function setupCarNumberConverter() {
    const carNumberInput = document.getElementById('carNumber');
    if (!carNumberInput) return;
    
    carNumberInput.addEventListener('input', function(e) {
        const input = e.target;
        const currentValue = input.value;
        const cursorPos = input.selectionStart;
        
        // 영문이 포함되어 있으면 한글로 변환
        if (/[a-zA-Z]/.test(currentValue)) {
            const converted = convertEnglishToKorean(currentValue);
            if (converted !== currentValue) {
                input.value = converted;
                // 커서 위치 복원
                setTimeout(() => {
                    const newPos = Math.min(cursorPos, converted.length);
                    input.setSelectionRange(newPos, newPos);
                }, 0);
            }
        }
    });
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
        console.error('Apps Script URL:', APPS_SCRIPT_URL);
        // 중복 체크 실패 시에도 계속 진행 (중복 체크는 선택적 기능)
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
        } else {
            console.error('데이터 가져오기 응답 오류:', response.status, response.statusText);
            console.error('Apps Script URL:', APPS_SCRIPT_URL);
        }
    } catch (error) {
        console.error('데이터 가져오기 네트워크 오류:', error);
        console.error('Apps Script URL:', APPS_SCRIPT_URL);
        console.error('오류 상세:', error.message);
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
    
    // 차량번호 영문→한글 변환 설정
    setupCarNumberConverter();
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
        // 제출 중 표시
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = '제출 중...';

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            redirect: 'follow' // 리다이렉트를 따라가도록 설정
        });

        // 응답 처리
        let responseData = null;
        const contentType = response.headers.get('content-type');
        
        try {
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                // JSON이 아닌 경우 텍스트로 읽기
                const text = await response.text();
                console.log('응답 텍스트:', text);
                // JSON 형식인지 확인
                try {
                    responseData = JSON.parse(text);
                } catch (e) {
                    responseData = { success: false, message: text };
                }
            }
        } catch (e) {
            console.error('응답 파싱 오류:', e);
            const text = await response.text().catch(() => '응답을 읽을 수 없습니다');
            responseData = { 
                success: false, 
                error: '응답 파싱 오류: ' + e.message,
                rawResponse: text 
            };
        }

        // 버튼 상태 복원
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;

        // 성공 여부 확인 (Apps Script는 리다이렉트 시 status가 200이 아닐 수 있음)
        const isSuccess = responseData && responseData.success === true;
        
        if (isSuccess) {
            // 성공 시 확인 화면 표시
            showConfirmScreen(data);
            console.log('✅ 데이터 전송 성공:', responseData);
        } else {
            // 실패 시 에러 메시지 표시
            const errorMessage = responseData?.error || responseData?.message || 
                                (response.status ? `HTTP ${response.status}` : '알 수 없는 오류');
            console.error('❌ 데이터 전송 실패:', {
                status: response.status,
                statusText: response.statusText,
                response: responseData
            });
            alert('데이터 저장에 실패했습니다.\n\n오류: ' + errorMessage + '\n\n브라우저 콘솔(F12)을 확인하거나 다시 시도해주세요.');
        }
    } catch (error) {
        // 버튼 상태 복원
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = '제출';

        console.error('❌ 제출 오류 발생:', error);
        console.error('오류 타입:', error.name);
        console.error('오류 메시지:', error.message);
        console.error('Apps Script URL:', APPS_SCRIPT_URL);
        
        // 더 명확한 에러 메시지
        let errorMessage = '네트워크 오류가 발생했습니다.';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Apps Script 서버에 연결할 수 없습니다.\n\n확인 사항:\n1. Apps Script 웹앱이 "모든 사용자" 권한으로 배포되었는지 확인\n2. 인터넷 연결 확인\n3. 브라우저 콘솔(F12)에서 자세한 오류 확인';
        } else {
            errorMessage = '오류: ' + (error.message || error.toString());
        }
        
        alert('제출 중 오류가 발생했습니다.\n\n' + errorMessage + '\n\n브라우저 개발자 도구(F12 > Console)를 확인하세요.');
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
