// Supabase 설정 (script.js와 동일)
const SUPABASE_URL = 'https://zlemqwewbnqjwmvbrafx.supabase.co';
// Supabase 대시보드에서 anon/public key를 가져와서 아래에 입력하세요
// Settings > API > Project API keys > anon public
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZW1xd2V3Ym5xandtdmJyYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODUwNzUsImV4cCI6MjA4MTI2MTA3NX0.nkw_wLExj-iOvuq5qru5_rh5-U81de0ObZbMNhizsK0';

// 관리자 비밀번호
const ADMIN_PASSWORD = '123456';

let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error('Supabase 초기화 실패:', e);
}

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', async () => {
    // 모든 입력창에서 복사/붙여넣기 차단
    disableCopyPaste();

    // 관리자 로그인 확인
    checkAdminLogin();

    // 관리자 로그인 폼
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAdminLogin();
        });
    }

    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminLoggedIn');
            location.reload();
        });
    }

    // 학생 등록 폼
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
        studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await registerStudent();
        });
    }

    // 문제 등록 폼
    const problemForm = document.getElementById('problem-form');
    if (problemForm) {
        problemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await registerProblem();
        });
    }

    // 제출 기록 로드
    if (isAdminLoggedIn()) {
        await loadSubmissions();
        await loadStudents();
        await loadPendingStudents();
    }
});

// 탭 전환 함수
function showTab(tabName) {
    // 모든 탭 버튼과 콘텐츠 숨기기
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    // 선택된 탭 활성화
    event.target.classList.add('active');
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }
}

// 모든 입력창에서 복사/붙여넣기 차단
function disableCopyPaste() {
    // 모든 input, textarea 요소에 이벤트 리스너 추가
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            // Ctrl+C, Ctrl+V, Ctrl+X 차단
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88)) {
                e.preventDefault();
                e.stopPropagation();
                alert('복사/붙여넣기는 허용되지 않습니다.');
                return false;
            }
        }
    });

    // 우클릭 메뉴 차단
    document.addEventListener('contextmenu', (e) => {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });
}

// 탭 전환 함수
function showTab(tabName) {
    // 모든 탭 버튼과 콘텐츠 숨기기
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    // 선택된 탭 활성화
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // 프로그래밍 방식 호출인 경우
        const tabBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
            btn.getAttribute('onclick')?.includes(tabName)
        );
        if (tabBtn) tabBtn.classList.add('active');
    }
    
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }
}

// 관리자 로그인 확인
function checkAdminLogin() {
    // URL에서 직접 접근하는 경우도 체크
    if (!isAdminLoggedIn()) {
        // 관리자 페이지 접근 시 무조건 로그인 화면 표시
        document.getElementById('admin-login').style.display = 'block';
        document.getElementById('admin-container').style.display = 'none';
        // 네비게이션 링크 숨기기
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.href.includes('admin.html')) {
                link.style.display = 'none';
            }
        });
    } else {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-container').style.display = 'block';
        // 기본 탭 활성화
        const firstTab = document.querySelector('.tab-btn');
        if (firstTab) {
            firstTab.click();
        }
    }
}

// 관리자 로그인 상태 확인
function isAdminLoggedIn() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

// 관리자 로그인 처리
async function handleAdminLogin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        checkAdminLogin();
        await loadSubmissions();
        await loadStudents();
    } else {
        alert('비밀번호가 올바르지 않습니다.');
    }
}

// 학생 등록
async function registerStudent() {
    const studentId = document.getElementById('student-id').value;
    const name = document.getElementById('student-name').value;
    const email = document.getElementById('student-email').value;

    // 학번 검증 (7자리 숫자)
    if (!/^[0-9]{7}$/.test(studentId)) {
        alert('학번은 7자리 숫자여야 합니다.');
        return;
    }

    // 이메일 검증
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('올바른 이메일 주소를 입력하세요.');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .insert({
                student_id: studentId,
                password: 'bgs-1111', // 초기 비밀번호
                name: name,
                email: email,
                approved: true, // 관리자가 직접 등록하는 경우 자동 승인
                password_changed: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                alert('이미 등록된 학번입니다.');
            } else {
                throw error;
            }
            return;
        }

        alert('학생이 등록되었습니다! (초기 비밀번호: bgs-1111)');
        document.getElementById('student-form').reset();
        await loadStudents();
    } catch (error) {
        console.error('학생 등록 실패:', error);
        alert('학생 등록 중 오류가 발생했습니다: ' + error.message);
    }
}

// 학생 CSV 일괄 등록
async function uploadStudentCSV() {
    const fileInput = document.getElementById('student-csv-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('CSV 파일을 선택해주세요.');
        return;
    }

    try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            alert('CSV 파일에 데이터가 없습니다.');
            return;
        }

        const students = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length < 3) continue;

            const studentId = values[0];
            const name = values[1];
            const email = values[2];

            // 검증
            if (!/^[0-9]{7}$/.test(studentId)) {
                alert(`줄 ${i + 1}: 학번이 올바르지 않습니다 (${studentId})`);
                continue;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert(`줄 ${i + 1}: 이메일이 올바르지 않습니다 (${email})`);
                continue;
            }

            students.push({
                student_id: studentId,
                password: 'bgs-1111',
                name: name,
                email: email,
                approved: true, // 관리자가 직접 등록하는 경우 자동 승인
                password_changed: false,
                created_at: new Date().toISOString()
            });
        }

        if (students.length === 0) {
            alert('등록할 학생이 없습니다.');
            return;
        }

        // 학생 일괄 등록
        const { data, error } = await supabase
            .from('students')
            .insert(students)
            .select();

        if (error) {
            if (error.code === '23505') {
                alert('일부 학번이 이미 등록되어 있습니다. 중복된 학번을 확인하세요.');
            } else {
                throw error;
            }
            return;
        }

        alert(`${students.length}명의 학생이 등록되었습니다! (초기 비밀번호: bgs-1111)`);
        fileInput.value = '';
        await loadStudents();
    } catch (error) {
        console.error('CSV 업로드 실패:', error);
        alert('CSV 업로드 중 오류가 발생했습니다: ' + error.message);
    }
}

// 회원가입 승인 대기 목록 로드
async function loadPendingStudents() {
    const container = document.getElementById('pending-students-container');

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('approved', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">승인 대기 중인 학생이 없습니다.</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f39c12; color: white;">
                        <th style="padding: 10px; border: 1px solid #ddd;">학번</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">성명</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">이메일</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">가입일</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">작업</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(student => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">${student.student_id}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${student.name}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${student.email}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${new Date(student.created_at).toLocaleString('ko-KR')}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <button class="btn btn-primary" onclick="approveStudent('${student.student_id}')" style="padding: 5px 10px; font-size: 12px; background: #27ae60;">승인</button>
                                <button class="btn btn-secondary" onclick="rejectStudent('${student.student_id}')" style="padding: 5px 10px; font-size: 12px; margin-left: 5px;">거부</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('승인 대기 목록 로드 실패:', error);
        container.innerHTML = '<p style="text-align: center; color: #e74c3c;">승인 대기 목록을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 학생 승인
async function approveStudent(studentId) {
    if (!confirm(`학번 ${studentId}의 회원가입을 승인하시겠습니까?`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('students')
            .update({
                approved: true,
                updated_at: new Date().toISOString()
            })
            .eq('student_id', studentId);

        if (error) throw error;

        alert('학생이 승인되었습니다.');
        await loadPendingStudents();
        await loadStudents();
    } catch (error) {
        console.error('학생 승인 실패:', error);
        alert('학생 승인 중 오류가 발생했습니다: ' + error.message);
    }
}

// 학생 거부 (삭제)
async function rejectStudent(studentId) {
    if (!confirm(`학번 ${studentId}의 회원가입을 거부하시겠습니까? (삭제됩니다)`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('student_id', studentId)
            .eq('approved', false);

        if (error) throw error;

        alert('학생이 거부되었습니다.');
        await loadPendingStudents();
    } catch (error) {
        console.error('학생 거부 실패:', error);
        alert('학생 거부 중 오류가 발생했습니다: ' + error.message);
    }
}

// 학생 목록 로드
async function loadStudents() {
    const container = document.getElementById('students-container');

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">등록된 학생이 없습니다.</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #4a90e2; color: white;">
                        <th style="padding: 10px; border: 1px solid #ddd;">학번</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">성명</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">이메일</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">비밀번호 변경 여부</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">등록일</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">작업</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(student => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">${student.student_id}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${student.name}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${student.email}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${student.password_changed ? '변경됨' : '초기 비밀번호'}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${new Date(student.created_at).toLocaleString('ko-KR')}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <button class="btn btn-primary" onclick="resetStudentPassword('${student.student_id}')" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">비밀번호 재설정</button>
                                <button class="btn btn-secondary" onclick="deleteStudent('${student.student_id}', '${student.name}')" style="padding: 5px 10px; font-size: 12px; background: #e74c3c;">삭제</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('학생 목록 로드 실패:', error);
        container.innerHTML = '<p style="text-align: center; color: #e74c3c;">학생 목록을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 학생 비밀번호 재설정
async function resetStudentPassword(studentId) {
    if (!confirm(`학번 ${studentId}의 비밀번호를 초기 비밀번호(bgs-1111)로 재설정하시겠습니까?`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('students')
            .update({
                password: 'bgs-1111',
                password_changed: false,
                updated_at: new Date().toISOString()
            })
            .eq('student_id', studentId);

        if (error) throw error;

        alert('비밀번호가 재설정되었습니다. (초기 비밀번호: bgs-1111)');
        await loadStudents();
    } catch (error) {
        console.error('비밀번호 재설정 실패:', error);
        alert('비밀번호 재설정 중 오류가 발생했습니다: ' + error.message);
    }
}

// 회원 삭제
async function deleteStudent(studentId, studentName) {
    if (!confirm(`학번 ${studentId} (${studentName}) 회원을 삭제하시겠습니까?\n\n주의: 삭제된 회원의 제출 기록도 함께 삭제됩니다.`)) {
        return;
    }

    try {
        // 먼저 제출 기록 삭제
        const { error: submissionError } = await supabase
            .from('submissions')
            .delete()
            .eq('student_id', studentId);

        if (submissionError) {
            console.warn('제출 기록 삭제 중 오류:', submissionError);
        }

        // 회원 삭제
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('student_id', studentId);

        if (error) throw error;

        alert('회원이 삭제되었습니다.');
        await loadStudents();
    } catch (error) {
        console.error('회원 삭제 실패:', error);
        alert('회원 삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

// 문제 등록
async function registerProblem() {
    const assignment = document.getElementById('problem-assignment').value;
    const title = document.getElementById('problem-title').value;
    const description = document.getElementById('problem-description').value;
    const constraints = document.getElementById('problem-constraints').value;
    const inputFormat = document.getElementById('problem-input-format').value;
    const outputFormat = document.getElementById('problem-output-format').value;
    const difficulty = document.getElementById('problem-difficulty').value;
    const deadline = document.getElementById('problem-deadline').value;
    const allowLate = document.getElementById('problem-allow-late').value === 'true';

    try {
        const { data, error } = await supabase
            .from('problems')
            .insert({
                assignment: assignment,
                title: title,
                description: description,
                constraints: constraints,
                input_format: inputFormat,
                output_format: outputFormat,
                difficulty: difficulty,
                deadline: deadline || null,
                allow_late_submission: allowLate,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        alert('문제가 등록되었습니다!');
        document.getElementById('problem-form').reset();
        document.getElementById('problem-assignment').value = '과제 1'; // 기본값 복원
    } catch (error) {
        console.error('문제 등록 실패:', error);
        alert('문제 등록 중 오류가 발생했습니다: ' + error.message);
    }
}

// CSV 업로드 (문제)
async function uploadCSV() {
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('CSV 파일을 선택해주세요.');
        return;
    }

    try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        const problems = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const problem = {};
            headers.forEach((header, index) => {
                problem[header] = values[index] || '';
            });
            problems.push(problem);
        }

        // 문제 일괄 등록
        const { data, error } = await supabase
            .from('problems')
            .insert(problems.map(p => ({
                title: p.title || '',
                description: p.description || '',
                constraints: p.constraints || '',
                input_format: p.input_format || '',
                output_format: p.output_format || '',
                difficulty: p.difficulty || '',
                deadline: p.deadline || null,
                allow_late_submission: p.allow_late === 'true',
                created_at: new Date().toISOString()
            })))
            .select();

        if (error) throw error;

        alert(`${problems.length}개의 문제가 등록되었습니다!`);
        fileInput.value = '';
    } catch (error) {
        console.error('CSV 업로드 실패:', error);
        alert('CSV 업로드 중 오류가 발생했습니다: ' + error.message);
    }
}

// 제출 기록 로드
async function loadSubmissions() {
    const container = document.getElementById('submissions-container');

    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('*, problems(title)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">제출 기록이 없습니다.</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #4a90e2; color: white;">
                        <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">학생</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">문제</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">상태</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">제출 시간</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">작업</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(sub => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">${sub.id}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${sub.student_name} (${sub.student_id})<br>
                                <small>${sub.student_email}</small>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${sub.problems?.title || 'N/A'}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <span class="result-${sub.status}">${getStatusText(sub.status)}</span>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                ${new Date(sub.created_at).toLocaleString('ko-KR')}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <button class="btn btn-primary" onclick="reviewSubmission(${sub.id})" style="padding: 5px 10px; font-size: 12px;">검토</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('제출 기록 로드 실패:', error);
        container.innerHTML = '<p style="text-align: center; color: #e74c3c;">제출 기록을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 상태 텍스트 변환
function getStatusText(status) {
    const statusMap = {
        'pending': '대기 중',
        'accepted': '통과',
        'rejected': '실패',
        'timeout': '시간 초과',
        'error': '오류'
    };
    return statusMap[status] || status;
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 제출 검토
async function reviewSubmission(submissionId) {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (error) throw error;

        const code = data.code || '';
        let typingData = [];
        try {
            typingData = data.typing_data ? (typeof data.typing_data === 'string' ? JSON.parse(data.typing_data) : data.typing_data) : [];
        } catch (e) {
            console.error('타이핑 데이터 파싱 오류:', e);
            typingData = [];
        }

        // 데이터 이스케이프 처리 (템플릿 리터럴 사용 전에)
        const escapedStudentName = escapeHtml(data.student_name || '');
        const escapedStudentId = escapeHtml(data.student_id || '');
        const escapedStudentEmail = escapeHtml(data.student_email || '');
        const escapedCode = escapeHtml(code);
        const escapedReviewNote = escapeHtml(data.review_note || '');
        const submissionTime = new Date(data.created_at).toLocaleString('ko-KR');
        const currentStatus = getStatusText(data.status);
        const currentScore = data.score || 0;

        // 검토 창 열기
        const reviewWindow = window.open('', 'review', 'width=900,height=700,scrollbars=yes');
        
        if (!reviewWindow) {
            alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
            return;
        }

        // HTML 내용 생성
        const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>제출 검토 - ${submissionId}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h2 { color: #4a90e2; margin-bottom: 20px; }
        h3 { color: #333; margin-top: 20px; margin-bottom: 10px; }
        .info-section { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
        .code-block { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; margin: 10px 0; overflow-x: auto; }
        pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; }
        .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
        .btn-accept { background: #27ae60; color: white; }
        .btn-accept:hover { background: #229954; }
        .btn-reject { background: #e74c3c; color: white; }
        .btn-reject:hover { background: #c0392b; }
        .typing-graph { width: 100%; height: 200px; border: 1px solid #ddd; border-radius: 5px; }
        input[type="number"] { padding: 5px; border: 1px solid #ddd; border-radius: 3px; width: 80px; }
        textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-family: inherit; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h2>제출 검토</h2>
        <div class="info-section">
            <p><strong>학생:</strong> ${escapedStudentName} (${escapedStudentId})</p>
            <p><strong>이메일:</strong> ${escapedStudentEmail}</p>
            <p><strong>제출 시간:</strong> ${submissionTime}</p>
            <p><strong>현재 상태:</strong> ${currentStatus}</p>
        </div>
        
        <h3>제출 코드</h3>
        <div class="code-block">
            <pre>${escapedCode}</pre>
        </div>

        <h3>타이핑 속도 그래프</h3>
        <canvas id="typing-graph" class="typing-graph"></canvas>

        <h3>검토 결과</h3>
        <div>
            <button class="btn btn-accept" onclick="submitReview('accepted', ${submissionId})">✓ 통과</button>
            <button class="btn btn-reject" onclick="submitReview('rejected', ${submissionId})">✗ 실패</button>
        </div>
        <div style="margin-top: 15px;">
            <label>점수: <input type="number" id="score" min="0" max="100" value="${currentScore}"></label>
        </div>
        <div style="margin-top: 15px;">
            <label>메모: <textarea id="review-note" rows="4" placeholder="검토 메모를 입력하세요">${escapedReviewNote}</textarea></label>
        </div>
    </div>

    <script>
        const typingData = ${JSON.stringify(typingData)};
        const supabaseKey = '${SUPABASE_KEY}';
        
        // 타이핑 그래프 그리기
        function drawTypingGraph() {
            const canvas = document.getElementById('typing-graph');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.offsetWidth;
            canvas.height = 200;

            if (typingData && typingData.length > 1) {
                const maxTime = Math.max(...typingData.map(d => d.time || 0));
                const maxSpeed = Math.max(...typingData.map(d => d.speed || 0), 1);

                // 배경 그리기
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 축 그리기
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, canvas.height - 20);
                ctx.lineTo(canvas.width, canvas.height - 20);
                ctx.moveTo(20, 0);
                ctx.lineTo(20, canvas.height);
                ctx.stroke();

                // 그래프 그리기
                ctx.strokeStyle = '#4a90e2';
                ctx.lineWidth = 2;
                ctx.beginPath();
                typingData.forEach((point, index) => {
                    const x = 20 + ((point.time || 0) / maxTime) * (canvas.width - 40);
                    const y = canvas.height - 20 - ((point.speed || 0) / maxSpeed) * (canvas.height - 40);
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                ctx.stroke();
            } else {
                ctx.fillStyle = '#999';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('타이핑 데이터가 없습니다', canvas.width / 2, canvas.height / 2);
            }
        }

        async function submitReview(status, id) {
            const score = document.getElementById('score').value;
            const note = document.getElementById('review-note').value;
            
            if (!confirm('검토 결과를 저장하시겠습니까?')) {
                return;
            }
            
            try {
                const response = await fetch('https://zlemqwewbnqjwmvbrafx.supabase.co/rest/v1/submissions?id=eq.' + id, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': 'Bearer ' + supabaseKey,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        status: status,
                        score: parseInt(score) || 0,
                        review_note: note,
                        reviewed_at: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    alert('검토가 완료되었습니다.');
                    if (window.opener) {
                        window.opener.location.reload();
                    }
                    window.close();
                } else {
                    const errorText = await response.text();
                    console.error('오류 응답:', errorText);
                    alert('검토 저장 중 오류가 발생했습니다. 콘솔을 확인하세요.');
                }
            } catch (error) {
                console.error('검토 저장 오류:', error);
                alert('검토 저장 중 오류가 발생했습니다: ' + error.message);
            }
        }

        // 페이지 로드 시 그래프 그리기
        window.onload = function() {
            drawTypingGraph();
        };
    </script>
</body>
</html>`;

        // 팝업 창에 내용 작성
        reviewWindow.document.open();
        reviewWindow.document.write(htmlContent);
        reviewWindow.document.close();
        
    } catch (error) {
        console.error('제출 검토 실패:', error);
        alert('제출 검토 중 오류가 발생했습니다: ' + error.message);
    }
}
