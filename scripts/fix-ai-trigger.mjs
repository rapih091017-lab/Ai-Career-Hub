import fs from 'fs';

const fp = 'src/app/builder/[id]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

// Add useEffect that watches for transition from Target Pekerjaan step
const aiHook = `
  /* -- AI trigger: when user leaves Target Pekerjaan (step 1) with filled data -- */
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
  }, [activeStep, cvData.jobTitle, cvData.jobDescription, aiJdSuggested, addToast]);
`;

// Insert after the auto-save useEffect
c = c.replace(
  '    return () => clearTimeout(timer);\n  }, [cvData, cvId]);\n\n  /* -- mount: fetch CV data -- */',
  '    return () => clearTimeout(timer);\n  }, [cvData, cvId]);' + aiHook + '\n  /* -- mount: fetch CV data -- */'
);

fs.writeFileSync(fp, c, 'utf8');
console.log('AI trigger added. Length:', c.length);
