import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

// Replace the AI trigger useEffect with one that actually calls the API
const oldHook = `  /* -- AI trigger: when user leaves Target Pekerjaan (step 1) with filled data -- */
  const [aiJdSuggested, setAiJdSuggested] = useState(false);
  const prevActiveStep = useRef(activeStep);

  useEffect(() => {
    const justLeft = prevActiveStep.current === 1 && activeStep > 1;
    prevActiveStep.current = activeStep;
    if (justLeft && (cvData.jobTitle || cvData.jobDescription) && !aiJdSuggested) {
      setAiJdSuggested(true);
      const id = setTimeout(() => {
        addToast({ type: "success", message: "AI teraktivasi! Berdasarkan target pekerjaan, isi pengalaman dan skill dengan kata kunci relevan untuk meningkatkan ATS Score." });
      }, 800);
      return () => clearTimeout(id);
    }
  }, [activeStep, cvData.jobTitle, cvData.jobDescription, aiJdSuggested, addToast]);`;

const newHook = `  /* -- AI trigger: when user leaves Target Pekerjaan (step 1) with filled data -- */
  const [aiJdSuggested, setAiJdSuggested] = useState(false);
  const [aiJdLoading, setAiJdLoading] = useState(false);
  const prevActiveStep = useRef(activeStep);

  useEffect(() => {
    const justLeft = prevActiveStep.current === 1 && activeStep > 1;
    prevActiveStep.current = activeStep;
    if (justLeft && (cvData.jobTitle || cvData.jobDescription) && !aiJdSuggested) {
      setAiJdSuggested(true);
      setAiJdLoading(true);
      // Call the AI revise API to get keyword suggestions
      fetch('/api/cv-documents/' + cvId + '/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'suggest',
          jobTitle: cvData.jobTitle,
          jobDescription: cvData.jobDescription,
          skills: cvData.skills.filter(s => s.level === 'advanced' || s.level === 'intermediate').map(s => s.name),
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.suggestions && data.suggestions.length > 0) {
            addToast({ type: "success", message: "AI siap membantu! Cek saran untuk setiap section berdasarkan target pekerjaanmu." });
          } else if (data.keywords) {
            addToast({ type: "success", message: "AI menganalisis lowongan! Kata kunci: " + data.keywords.slice(0, 5).join(", ") + "... Gunakan di setiap section CV-mu." });
          } else {
            addToast({ type: "success", message: "AI teraktivasi! Berdasarkan target pekerjaan, isi pengalaman dan skill dengan kata kunci relevan untuk meningkatkan ATS Score." });
          }
        })
        .catch(function () {
          addToast({ type: "success", message: "AI teraktivasi! Isi setiap section dengan kata kunci dari deskripsi pekerjaan untuk hasil maksimal." });
        })
        .finally(function () { setAiJdLoading(false); });
    }
  }, [activeStep, cvData.jobTitle, cvData.jobDescription, aiJdSuggested, addToast, cvId]);`;

c = c.replace(oldHook, newHook);

fs.writeFileSync(fp, c, 'utf8');
console.log('AI API call added. Length:', c.length);
