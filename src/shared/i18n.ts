import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  es: { translation: {
    tagline: 'Tus cartas, más claras.',
    navHome: 'Inicio', navAnalyze: 'Analizar carta', navDocuments: 'Mis cartas',
    switchLanguage: 'English', signOut: 'Cerrar sesión',
    eyebrow: 'ENTIENDE · COMPRUEBA · ACTÚA',
    headline: 'Una carta oficial no debería dejarte sin saber qué hacer.',
    intro: 'EasyAmt convierte cartas administrativas alemanas en pasos claros, con fechas y citas del documento para que puedas comprobar cada obligación.',
    start: 'Empezar', howItWorks: 'Cómo funciona',
    step1Title: 'Sube tu PDF', step1Body: 'Una carta alemana, de hasta 5 MB y 8 páginas.',
    step2Title: 'Revisa la evidencia', step2Body: 'Cada obligación muestra su cita original y el nivel de verificación.',
    step3Title: 'Sigue los pasos', step3Body: 'Consulta fechas, documentos necesarios y una lista ordenada de tareas.',
    prototype: 'Prototipo. Cuando el análisis esté disponible, EasyAmt enviará el contenido del PDF a Google Cloud Vertex AI. No subas documentos reales con datos personales. Los resultados se guardarán en tu cuenta y podrás eliminarlos. Comprueba siempre la carta original: esto no es asesoramiento legal.',
    uploadEyebrow: 'NUEVO ANÁLISIS', uploadTitle: 'Empecemos por tu carta.',
    uploadIntro: 'El PDF permanece en memoria durante el análisis. No se guarda el archivo original.',
    chooseFile: 'Seleccionar PDF', dropHint: 'PDF digital o escaneado · máximo 5 MB · máximo 8 páginas',
    selectedFile: 'Archivo seleccionado', outputLanguage: 'Idioma del resumen',
    consent: 'Entiendo que, al iniciar un análisis, el contenido del PDF se enviará a Google Cloud Vertex AI y los resultados se guardarán en mi cuenta.',
    pendingApi: 'La carga estará disponible cuando el backend publique la ruta de análisis y el contrato OpenAPI.',
    localReady: 'Archivo validado localmente. La comprobación de páginas se hará en el backend.',
    notPdf: 'Selecciona un archivo PDF válido.', tooLarge: 'El PDF supera el límite de 5 MB.', emptyFile: 'El archivo está vacío.',
    documentsTitle: 'Tus cartas', documentsEmpty: 'Aquí aparecerán los análisis cuando la API de documentos esté disponible.',
    authTitle: 'Accede a EasyAmt', email: 'Correo electrónico', password: 'Contraseña',
    signIn: 'Iniciar sesión', signUp: 'Crear cuenta', authError: 'No se pudo completar la autenticación.',
    configNotice: 'Vista previa del frontend. Configura Supabase en .env para activar el acceso.',
    account: 'Cuenta', accountPending: 'La eliminación de cuenta se conectará cuando el backend publique esa ruta.',
    footer: 'EasyAmt · Información orientativa, no asesoramiento legal.',
  } },
  en: { translation: {
    tagline: 'Understand your letters.',
    navHome: 'Home', navAnalyze: 'Analyze letter', navDocuments: 'My letters',
    switchLanguage: 'Español', signOut: 'Sign out',
    eyebrow: 'UNDERSTAND · VERIFY · ACT',
    headline: 'An official letter should not leave you wondering what to do.',
    intro: 'EasyAmt turns German administrative letters into clear steps, dates and source quotes so you can verify every obligation.',
    start: 'Get started', howItWorks: 'How it works',
    step1Title: 'Upload your PDF', step1Body: 'One German letter, up to 5 MB and 8 pages.',
    step2Title: 'Check the evidence', step2Body: 'Each obligation shows its original quote and verification level.',
    step3Title: 'Follow the steps', step3Body: 'See deadlines, required documents and an ordered checklist.',
    prototype: 'Prototype. When analysis is available, EasyAmt will send the PDF contents to Google Cloud Vertex AI. Do not upload real documents containing personal data. Results will be saved to your account and you will be able to delete them. Always check the original letter: this is not legal advice.',
    uploadEyebrow: 'NEW ANALYSIS', uploadTitle: 'Let’s start with your letter.',
    uploadIntro: 'The PDF is kept in memory during analysis. The original file is not stored.',
    chooseFile: 'Choose PDF', dropHint: 'Digital or scanned PDF · up to 5 MB · up to 8 pages',
    selectedFile: 'Selected file', outputLanguage: 'Summary language',
    consent: 'I understand that, when I start an analysis, the PDF contents will be sent to Google Cloud Vertex AI and the results will be saved to my account.',
    pendingApi: 'Upload will be available when the backend publishes the analysis route and OpenAPI contract.',
    localReady: 'File validated locally. The backend will check the page count.',
    notPdf: 'Choose a valid PDF file.', tooLarge: 'The PDF exceeds the 5 MB limit.', emptyFile: 'The file is empty.',
    documentsTitle: 'Your letters', documentsEmpty: 'Your analyses will appear here when the documents API is available.',
    authTitle: 'Sign in to EasyAmt', email: 'Email', password: 'Password',
    signIn: 'Sign in', signUp: 'Create account', authError: 'Authentication could not be completed.',
    configNotice: 'Frontend preview. Configure Supabase in .env to enable sign in.',
    account: 'Account', accountPending: 'Account deletion will be connected when the backend publishes that route.',
    footer: 'EasyAmt · Guidance only, not legal advice.',
  } },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('easyamt-language') === 'en' ? 'en' : 'es',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

export default i18n
