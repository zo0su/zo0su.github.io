// Supabase 설정
const SUPABASE_URL = 'https://zlemqwewbnqjwmvbrafx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZW1xd2V3Ym5xandtdmJyYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODUwNzUsImV4cCI6MjA4MTI2MTA3NX0.nkw_wLExj-iOvuq5qru5_rh5-U81de0ObZbMNhizsK0';

// Supabase 클라이언트 초기화
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error('Supabase 초기화 실패:', e);
}

// 관리자 비밀번호
const ADMIN_PASSWORD = '123456';

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', () => {
    // 모든 입력창에서 복사/붙여넣기 차단
    disableCopyPaste();

    // 로그인 폼
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }

    // 회원가입 폼
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSignup();
        });
    }

    // 비밀번호 변경 폼
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleChangePassword();
        });
    }

    // 관리자 로그인 모달 폼
    const adminLoginModalForm = document.getElementById('admin-login-modal-form');
    if (adminLoginModalForm) {
        adminLoginModalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAdminLoginModal();
        });
    }

    // 모달 외부 클릭 시 닫기
    window.onclick = function(event) {
        const modal = document.getElementById('admin-login-modal');
        if (event.target === modal) {
            closeAdminLogin();
        }
    }

    // 로그인 상태 확인
    checkLoginStatus();
});

// 로그인 상태 확인
function checkLoginStatus() {
    const studentLoggedIn = localStorage.getItem('studentLoggedIn');
    if (studentLoggedIn === 'true') {
        // 이미 로그인된 경우 main.html로 리다이렉트
        window.location.href = 'main.html';
    }
}

// 모든 입력창에서 복사/붙여넣기 차단
function disableCopyPaste() {
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88)) {
                e.preventDefault();
                e.stopPropagation();
                alert('복사/붙여넣기는 허용되지 않습니다.');
                return false;
            }
        }
    });

    document.addEventListener('contextmenu', (e) => {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });
}

// 화면 전환 함수
function showLogin() {
    document.getElementById('login-view').classList.add('active');
    document.getElementById('signup-view').classList.remove('active');
    document.getElementById('change-password-view').classList.remove('active');
}

function showSignup() {
    document.getElementById('login-view').classList.remove('active');
    document.getElementById('signup-view').classList.add('active');
    document.getElementById('change-password-view').classList.remove('active');
}

function showChangePassword() {
    document.getElementById('login-view').classList.remove('active');
    document.getElementById('signup-view').classList.remove('active');
    document.getElementById('change-password-view').classList.add('active');
}

// 로그인 처리
async function handleLogin() {
    const studentId = document.getElementById('login-student-id').value;
    const password = document.getElementById('login-password').value;

    if (!/^[0-9]{7}$/.test(studentId)) {
        alert('학번은 7자리 숫자여야 합니다.');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                alert('등록되지 않은 학번이거나 관리자 승인이 필요합니다.');
            } else {
                throw error;
            }
            return;
        }

        if (!data.approved) {
            alert('관리자 승인 대기 중입니다. 승인 후 로그인 가능합니다.');
            return;
        }

        if (data.password !== password) {
            alert('비밀번호가 올바르지 않습니다.');
            return;
        }

        // 로그인 성공 - localStorage에 저장
        localStorage.setItem('studentLoggedIn', 'true');
        localStorage.setItem('studentId', data.student_id);
        localStorage.setItem('studentName', data.name);
        localStorage.setItem('studentEmail', data.email);

        // main.html로 리다이렉트
        window.location.href = 'main.html';
    } catch (error) {
        console.error('로그인 실패:', error);
        alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
}

// 회원가입 처리
async function handleSignup() {
    const studentId = document.getElementById('signup-student-id').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;

    if (!/^[0-9]{7}$/.test(studentId)) {
        alert('학번은 7자리 숫자여야 합니다.');
        return;
    }

    if (password.length < 8) {
        alert('비밀번호는 8자 이상이어야 합니다.');
        return;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/.test(password)) {
        alert('비밀번호는 영문과 숫자를 포함해야 합니다.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('올바른 이메일 주소를 입력하세요.');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .insert({
                student_id: studentId,
                password: password,
                name: name,
                email: email,
                approved: false,
                password_changed: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                alert('이미 등록된 학번입니다.');
            } else {
                throw error;
            }
            return;
        }

        alert('회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.');
        document.getElementById('signup-form').reset();
        showLogin();
    } catch (error) {
        console.error('회원가입 실패:', error);
        alert('회원가입 중 오류가 발생했습니다: ' + error.message);
    }
}

// 비밀번호 변경 처리
async function handleChangePassword() {
    const studentId = document.getElementById('change-student-id').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!/^[0-9]{7}$/.test(studentId)) {
        alert('학번은 7자리 숫자여야 합니다.');
        return;
    }

    if (newPassword.length < 8) {
        alert('비밀번호는 8자 이상이어야 합니다.');
        return;
    }

    if (!/^(?=.*[a-z])(?=.*[0-9])[a-z0-9]+$/.test(newPassword)) {
        alert('비밀번호는 영문 소문자와 숫자를 포함해야 합니다.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
    }

    try {
        const { data: student, error: fetchError } = await supabase
            .from('students')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (fetchError) {
            alert('등록되지 않은 학번입니다.');
            return;
        }

        if (student.password !== currentPassword) {
            alert('현재 비밀번호가 올바르지 않습니다.');
            return;
        }

        const { error: updateError } = await supabase
            .from('students')
            .update({
                password: newPassword,
                password_changed: true,
                updated_at: new Date().toISOString()
            })
            .eq('student_id', studentId);

        if (updateError) throw updateError;

        alert('비밀번호가 변경되었습니다. 로그인해주세요.');
        document.getElementById('change-password-form').reset();
        showLogin();
    } catch (error) {
        console.error('비밀번호 변경 실패:', error);
        alert('비밀번호 변경 중 오류가 발생했습니다: ' + error.message);
    }
}

// 관리자 로그인 모달 표시
function showAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'block';
}

// 관리자 로그인 모달 닫기
function closeAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'none';
    document.getElementById('admin-password-modal').value = '';
}

// 관리자 로그인 처리 (모달)
async function handleAdminLoginModal() {
    const password = document.getElementById('admin-password-modal').value;
    
    if (password === ADMIN_PASSWORD) {
        // 관리자 페이지로 이동
        window.location.href = 'admin.html';
    } else {
        alert('비밀번호가 올바르지 않습니다.');
    }
}

