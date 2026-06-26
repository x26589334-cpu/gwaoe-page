// Scroll reveal
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target);} });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach((el,i)=>{ el.style.transitionDelay=(i%3*60)+'ms'; io.observe(el); });

// Form submit (demo)
const form = document.getElementById('applyForm');
if(form){
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const grade = form.grade.value;
    const subject = form.subject.value;
    if(!name || !phone || !grade || !subject){
      alert('이름, 연락처, 학년, 분야를 모두 입력해 주세요.');
      return;
    }
    document.getElementById('okMsg').style.display='block';
    form.querySelector('button').textContent='신청 완료 ✓';
    form.querySelector('button').disabled=true;
  });
}
