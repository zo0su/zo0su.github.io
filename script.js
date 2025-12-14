// Supabase 설정
const SUPABASE_URL = 'https://zlemqwewbnqjwmvbrafx.supabase.co';
// Supabase 대시보드에서 anon/public key를 가져와서 아래에 입력하세요
// Settings > API > Project API keys > anon public
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZW1xd2V3Ym5xandtdmJyYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODUwNzUsImV4cCI6MjA4MTI2MTA3NX0.nkw_wLExj-iOvuq5qru5_rh5-U81de0ObZbMNhizsK0';

// Supabase 클라이언트 초기화
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error('Supabase 초기화 실패:', e);
}

// 전역 변수
let currentProblemId = null;
let editor = null;
let typingData = [];
let typingStartTime = null;
let chart = null;

// Monaco Editor 초기화
function initEditor() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) return;

    // Monaco Editor 로드 시도
    if (typeof require !== 'undefined') {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            try {
                editor = monaco.editor.create(editorElement, {
                    value: '# Python 코드를 작성하세요\n',
                    language: 'python',
                    theme: 'vs-dark',
                    fontSize: 14,
                    minimap: { enabled: false },
                    automaticLayout: true
                });

                setupEditorEvents();
            } catch (e) {
                console.error('Monaco Editor 생성 실패:', e);
                initFallbackEditor();
            }
        }, function (err) {
            console.error('Monaco Editor 로드 실패:', err);
            initFallbackEditor();
        });
    } else {
        // require가 없으면 대체 에디터 사용
        initFallbackEditor();
    }
}

// 대체 에디터 (textarea 기반)
function initFallbackEditor() {
    const editorElement = document.getElementById('editor');
    editorElement.innerHTML = '<textarea id="code-textarea" style="width: 100%; height: 100%; border: none; padding: 10px; font-family: monospace; font-size: 14px; resize: none;"># Python 코드를 작성하세요\n</textarea>';
    
    const textarea = document.getElementById('code-textarea');
    
    // 복사 붙여넣기 방지
    textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88)) {
            e.preventDefault();
            alert('복사/붙여넣기는 허용되지 않습니다.');
            return false;
        }
        
        // 타이핑 속도 추적
        trackTypingSpeed();
    });
    
    textarea.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // 에디터 객체 대체
    editor = {
        getValue: () => textarea.value,
        setValue: (value) => { textarea.value = value; }
    };
}

// 에디터 이벤트 설정 (Monaco Editor용)
function setupEditorEvents() {
    if (!editor) return;

    // 복사 붙여넣기 방지
    editor.onKeyDown((e) => {
        // Ctrl+C, Ctrl+V, Ctrl+X 방지
        if ((e.ctrlKey || e.metaKey) && (e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88)) {
            e.preventDefault();
            e.stopPropagation();
            alert('복사/붙여넣기는 허용되지 않습니다.');
            return false;
        }
    });

    // 타이핑 속도 추적
    editor.onKeyDown((e) => {
        trackTypingSpeed();
    });

    // 우클릭 메뉴 비활성화
    editor.onContextMenu(() => {
        return false;
    });
}

// 타이핑 속도 추적
function trackTypingSpeed() {
    if (!editor) return;
    
    if (!typingStartTime) {
        typingStartTime = Date.now();
    }
    
    const currentTime = Date.now();
    const elapsed = (currentTime - typingStartTime) / 1000; // 초 단위
    const keystrokes = editor.getValue().length;
    const speed = elapsed > 0 ? (keystrokes / elapsed) * 60 : 0; // 분당 타수
    
    typingData.push({
        time: elapsed,
        speed: speed,
        keystrokes: keystrokes
    });

    updateTypingGraph();
}

// 타이핑 속도 그래프 업데이트
function updateTypingGraph() {
    const canvas = document.getElementById('typing-graph');
    if (!canvas || typingData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 200;

    ctx.clearRect(0, 0, width, height);

    if (typingData.length < 2) return;

    const maxTime = Math.max(...typingData.map(d => d.time));
    const maxSpeed = Math.max(...typingData.map(d => d.speed), 1);

    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 2;
    ctx.beginPath();

    typingData.forEach((point, index) => {
        const x = (point.time / maxTime) * width;
        const y = height - (point.speed / maxSpeed) * height;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // 축 그리기
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    // 레이블
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText('시간 (초)', width / 2 - 30, height - 5);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('타이핑 속도 (타/분)', 0, 0);
    ctx.restore();
}

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', async () => {
    // 모든 입력창에서 복사/붙여넣기 차단
    disableCopyPaste();

    // 로그인 상태 확인 (main.html에서만)
    checkStudentLogin();

    // main.html에서는 로그인 폼이 없으므로 제거됨

    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-student-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('studentLoggedIn');
            localStorage.removeItem('studentId');
            localStorage.removeItem('studentName');
            localStorage.removeItem('studentEmail');
            // index.html로 리다이렉트
            window.location.href = 'index.html';
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

    if (isStudentLoggedIn()) {
        initEditor();
        await loadProblemList();
        
        // 뒤로가기 버튼
        document.getElementById('back-btn')?.addEventListener('click', () => {
            showProblemList();
        });

        // 제출 버튼
        document.getElementById('submit-btn')?.addEventListener('click', async () => {
            await submitCode();
        });
    }
});

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

    // 드래그 방지 (선택 방지)
    document.addEventListener('selectstart', (e) => {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            // 선택은 허용하되 복사는 차단됨
        }
    });
}

// 학생 로그인 확인 (main.html에서만 사용)
function checkStudentLogin() {
    if (!isStudentLoggedIn()) {
        // 로그인되지 않은 경우 index.html로 리다이렉트
        window.location.href = 'index.html';
        return;
    }

    // 로그인된 경우: 문제 목록 표시
    document.getElementById('loading').style.display = 'none';
    document.getElementById('problem-list').style.display = 'block';
    
        // 학생 정보 표시
        const studentInfo = document.getElementById('student-info');
        if (studentInfo) {
            const studentId = localStorage.getItem('studentId');
            const studentName = localStorage.getItem('studentName');
            const studentClass = localStorage.getItem('studentClass');
            studentInfo.textContent = `${studentName} (${studentId}) ${studentClass ? `- ${studentClass}반` : ''}`;
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
    const ADMIN_PASSWORD = '123456';
    
    if (password === ADMIN_PASSWORD) {
        // 관리자 페이지로 이동
        window.location.href = 'admin.html';
    } else {
        alert('비밀번호가 올바르지 않습니다.');
    }
}

// 학생 로그인 상태 확인
function isStudentLoggedIn() {
    return localStorage.getItem('studentLoggedIn') === 'true';
}

// 학생 회원가입 화면 표시
function showStudentSignup() {
    document.getElementById('student-login').style.display = 'none';
    document.getElementById('student-signup').style.display = 'block';
    document.getElementById('change-password').style.display = 'none';
}

// 학생 로그인 화면 표시
function showStudentLogin() {
    document.getElementById('student-signup').style.display = 'none';
    document.getElementById('student-login').style.display = 'block';
    document.getElementById('change-password').style.display = 'none';
}

// 학생 회원가입 처리
async function handleStudentSignup() {
    const studentId = document.getElementById('signup-student-id').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;

    // 학번 검증 (7자리 숫자)
    if (!/^[0-9]{7}$/.test(studentId)) {
        alert('학번은 7자리 숫자여야 합니다.');
        return;
    }

    // 비밀번호 검증 (8자 이상, 영문+숫자)
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
                password: password,
                name: name,
                email: email,
                approved: false, // 관리자 승인 대기
                password_changed: true,
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

        alert('회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.');
        document.getElementById('student-signup-form').reset();
        showStudentLogin();
    } catch (error) {
        console.error('회원가입 실패:', error);
        alert('회원가입 중 오류가 발생했습니다: ' + error.message);
    }
}

// 학생 로그인 처리
async function handleStudentLogin() {
    const studentId = document.getElementById('login-student-id').value;
    const password = document.getElementById('login-password').value;

    // 학번 검증
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

        // 관리자 승인 확인
        if (!data.approved) {
            alert('관리자 승인 대기 중입니다. 승인 후 로그인 가능합니다.');
            return;
        }

        if (data.password !== password) {
            alert('비밀번호가 올바르지 않습니다.');
            return;
        }

        // 로그인 성공
        localStorage.setItem('studentLoggedIn', 'true');
        localStorage.setItem('studentId', data.student_id);
        localStorage.setItem('studentName', data.name);
        localStorage.setItem('studentEmail', data.email);

        checkStudentLogin();
        initEditor();
        await loadProblemList();
    } catch (error) {
        console.error('로그인 실패:', error);
        alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
}

// 비밀번호 변경 화면 표시
function showChangePassword() {
    document.getElementById('student-signup').style.display = 'none';
    document.getElementById('student-login').style.display = 'none';
    document.getElementById('change-password').style.display = 'block';
}

// 학생 로그인 화면 표시
function showStudentLogin() {
    document.getElementById('student-login').style.display = 'block';
    document.getElementById('change-password').style.display = 'none';
}

// 비밀번호 변경 처리
async function handleChangePassword() {
    const studentId = document.getElementById('change-student-id').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 학번 검증
    if (!/^[0-9]{7}$/.test(studentId)) {
        alert('학번은 7자리 숫자여야 합니다.');
        return;
    }

    // 새 비밀번호 검증 (8자 이상, 영문 소문자 + 숫자)
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
        // 현재 비밀번호 확인
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

        // 비밀번호 변경
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
        showStudentLogin();
    } catch (error) {
        console.error('비밀번호 변경 실패:', error);
        alert('비밀번호 변경 중 오류가 발생했습니다: ' + error.message);
    }
}

// 문제 목록 로드 (학반별 필터링, 과제별 그룹화)
async function loadProblemList() {
    const loading = document.getElementById('loading');
    const problemList = document.getElementById('problem-list');
    const container = document.getElementById('problems-container');

    try {
        loading.style.display = 'block';
        problemList.style.display = 'none';

        if (!supabase) {
            throw new Error('Supabase가 초기화되지 않았습니다.');
        }

        // 학생의 학반 정보 가져오기
        const studentClass = localStorage.getItem('studentClass');
        if (!studentClass) {
            container.innerHTML = '<p style="text-align: center; color: #e74c3c;">학반 정보를 찾을 수 없습니다. 다시 로그인해주세요.</p>';
            loading.style.display = 'none';
            problemList.style.display = 'block';
            return;
        }

        // 학생의 학반과 일치하는 모든 문제 가져오기 (과제별 그룹화)
        const { data, error } = await supabase
            .from('problems')
            .select('*')
            .eq('class', studentClass)
            .order('assignment', { ascending: true })
            .order('id', { ascending: true });

        if (error) throw error;

        loading.style.display = 'none';
        problemList.style.display = 'block';

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">등록된 문제가 없습니다.</p>';
            return;
        }

        // 과제별로 그룹화
        const problemsByAssignment = {};
        data.forEach(problem => {
            const assignment = problem.assignment || '기타';
            if (!problemsByAssignment[assignment]) {
                problemsByAssignment[assignment] = [];
            }
            problemsByAssignment[assignment].push(problem);
        });

        // 과제별로 HTML 생성
        let html = '';
        Object.keys(problemsByAssignment).sort().forEach(assignment => {
            const problems = problemsByAssignment[assignment];
            html += `
                <div class="assignment-group" style="margin-bottom: 30px;">
                    <h2 style="color: #4a90e2; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; margin-bottom: 15px;">${assignment}</h2>
                    ${problems.map((problem, index) => `
                        <div class="problem-card" onclick="showProblemDetail(${problem.id})" style="margin-bottom: 15px;">
                            <h3>${problem.title}</h3>
                            <p>${problem.description || ''}</p>
                            <div class="problem-meta">
                                <span>문제 번호: ${problem.id}</span>
                                <span>난이도: ${problem.difficulty || 'N/A'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('문제 목록 로드 실패:', error);
        loading.style.display = 'none';
        problemList.style.display = 'block';
        container.innerHTML = '<p style="text-align: center; color: #e74c3c;">문제를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 문제 상세 보기
async function showProblemDetail(problemId) {
    currentProblemId = problemId;
    const problemList = document.getElementById('problem-list');
    const problemDetail = document.getElementById('problem-detail');
    const problemInfo = document.getElementById('problem-info');

    try {
        const { data, error } = await supabase
            .from('problems')
            .select('*')
            .eq('id', problemId)
            .single();

        if (error) throw error;

        problemList.style.display = 'none';
        problemDetail.style.display = 'block';

        const deadline = data.deadline ? new Date(data.deadline) : null;
        const now = new Date();
        const isExpired = deadline && now > deadline;

        problemInfo.innerHTML = `
            <h2>${data.assignment ? `[${data.assignment}] ` : ''}${data.title}</h2>
            <div class="constraints">
                <h4>문제 설명</h4>
                <p>${data.description || '설명이 없습니다.'}</p>
            </div>
            <div class="constraints">
                <h4>제약 조건</h4>
                <p>${data.constraints || '제약 조건이 없습니다.'}</p>
            </div>
            <div class="constraints">
                <h4>입력 형식</h4>
                <pre>${data.input_format || 'N/A'}</pre>
            </div>
            <div class="constraints">
                <h4>출력 형식</h4>
                <pre>${data.output_format || 'N/A'}</pre>
            </div>
            ${deadline ? `
                <div class="deadline">
                    제출 기한: ${deadline.toLocaleString('ko-KR')}
                    ${isExpired ? ' (기한 만료)' : ''}
                </div>
            ` : ''}
        `;

        // 에디터 초기화
        if (editor) {
            editor.setValue('# Python 코드를 작성하세요\n');
        }
        
        // 타이핑 데이터 초기화
        typingData = [];
        typingStartTime = null;
        updateTypingGraph();

        // 결과 초기화
        document.getElementById('result-container').innerHTML = '';
    } catch (error) {
        console.error('문제 상세 로드 실패:', error);
        alert('문제를 불러오는 중 오류가 발생했습니다.');
    }
}

// 문제 목록 보기
function showProblemList() {
    document.getElementById('problem-list').style.display = 'block';
    document.getElementById('problem-detail').style.display = 'none';
    currentProblemId = null;
}

// 코드 제출
async function submitCode() {
    if (!currentProblemId) {
        alert('문제를 선택해주세요.');
        return;
    }

    if (!editor) {
        alert('에디터가 초기화되지 않았습니다.');
        return;
    }

    const code = editor.getValue();
    if (!code || code.trim() === '' || code.trim() === '# Python 코드를 작성하세요') {
        alert('코드를 작성해주세요.');
        return;
    }

    // 로그인 확인
    if (!isStudentLoggedIn()) {
        alert('로그인이 필요합니다.');
        checkStudentLogin();
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const resultContainer = document.getElementById('result-container');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '제출 중...';

        // 로그인한 학생 정보 사용 (입력 요청 없이)
        const studentId = localStorage.getItem('studentId');
        const studentName = localStorage.getItem('studentName');
        const studentEmail = localStorage.getItem('studentEmail');
        const studentClass = localStorage.getItem('studentClass') || '';

        if (!studentId || !studentName || !studentEmail) {
            alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
            submitBtn.disabled = false;
            submitBtn.textContent = '제출';
            localStorage.removeItem('studentLoggedIn');
            checkStudentLogin();
            return;
        }

        // 제출 기록 저장
        const { data: submission, error: submitError } = await supabase
            .from('submissions')
            .insert({
                problem_id: currentProblemId,
                student_id: studentId,
                student_name: studentName,
                student_email: studentEmail,
                class: studentClass,  // 학반 정보 추가
                code: code,
                status: 'pending',
                typing_data: JSON.stringify(typingData),
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (submitError) throw submitError;

        resultContainer.innerHTML = `
            <h4>제출 결과</h4>
            <p class="result-pending">제출이 완료되었습니다. 관리자가 검토 중입니다.</p>
            <p>제출 ID: ${submission.id}</p>
            <p>제출 시간: ${new Date(submission.created_at).toLocaleString('ko-KR')}</p>
        `;

        // 타이핑 데이터 초기화
        typingData = [];
        typingStartTime = null;
        updateTypingGraph();

    } catch (error) {
        console.error('제출 실패:', error);
        resultContainer.innerHTML = `
            <h4>제출 결과</h4>
            <p class="result-fail">제출 중 오류가 발생했습니다: ${error.message}</p>
        `;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '제출';
    }
}
