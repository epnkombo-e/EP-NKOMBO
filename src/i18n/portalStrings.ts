import type { LanguageCode } from './translations';

export interface PortalExtrasStrings {
  pillars: {
    kicker: string;
    heading: string;
    items: {
      index: string;
      title: string;
      description: string;
    }[];
  };
  contact: {
    phoneLabel: string;
    callNowLabel: string;
    photoConsentNote: string;
    onlineExamQuickLabel: string;
  };
  exam: {
    kicker: string;
    heading: string;
    intro: string;
    startFocusBtn: string;
    exitFocusBtn: string;
    instructionsTitle: string;
    instructionsBody: string;
    studentDeckTitle: string;
    districtLabel: string;
    sectorLabel: string;
    schoolLabel: string;
    studentNameLabel: string;
    studentPlaceholder: string;
    classLabel: string;
    classPlaceholder: string;
    candidateLabel: string;
    candidatePlaceholder: string;
    examDateLabel: string;
    answeredOf: string;
    timerLabel: string;
    filterAll: string;
    filterUnanswered: string;
    q2Rule: string;
    submitBtn: string;
    submittingBtn: string;
    resetBtn: string;
    printBtn: string;
    errMissingFields: string;
    errQ2Limit: string;
    resultHeading: string;
    scoreLabel: string;
    accuracyLabel: string;
    timeSpentLabel: string;
    refCodeLabel: string;
    savedToOfficeNote: string;
    topicBreakdownTitle: string;
    answerReviewTitle: string;
    correctLabel: string;
    incorrectLabel: string;
    correctKeyPrefix: string;
    allAnsweredNote: string;
    unansweredListPrefix: string;
  };
}

const EN_PORTAL: PortalExtrasStrings = {
  pillars: {
    kicker: 'Why EP Saint Pierre Nkombo · Three School Pillars',
    heading: 'Learning today, leading tomorrow across Bugarura & Lake Kivu',
    items: [
      {
        index: '01.',
        title: 'Quality Learning',
        description:
          'Strong foundations in reading, numeracy, science, and bilingual mastery reinforced by interactive P6 national exam preparation.',
      },
      {
        index: '02.',
        title: 'Community Partnership',
        description:
          'Close parent–teacher collaboration across Bugarura Cell and Nkombo Sector keeping every family informed and engaged.',
      },
      {
        index: '03.',
        title: 'Whole-Child Development',
        description:
          'Confidence, practical teamwork, hillside agroecology, choir, sports, and values built inside and outside the classroom.',
      },
    ],
  },
  contact: {
    phoneLabel: 'School Phone Line',
    callNowLabel: 'Call School Office',
    photoConsentNote: 'Note: Campus and student activity photographs are published with parent and guardian consent.',
    onlineExamQuickLabel: 'Take P6 Science & Technology Online Exam',
  },
  exam: {
    kicker: 'Primary Leaving National Examinations · P6 Online Portal',
    heading: 'Science & Elementary Technology (SET) Interactive Exam',
    intro:
      'Practice with all 50 official Primary 6 national exam questions, filter by topic, receive instant automatic grading with a topic breakdown, and submit your score directly to the EP Saint Pierre Nkombo school office.',
    startFocusBtn: 'Show Exam Map',
    exitFocusBtn: 'Hide Exam Map',
    instructionsTitle: 'Exam Instructions',
    instructionsBody:
      'Complete your student details, then select one answer for every question—except Question 2, where you must select exactly two answers. Click Submit Exam when ready to grade and record your attempt.',
    studentDeckTitle: 'Student & School Information',
    districtLabel: 'District',
    sectorLabel: 'Sector',
    schoolLabel: 'School Name',
    studentNameLabel: "Student's Full Name",
    studentPlaceholder: 'Enter full name',
    classLabel: 'Class',
    classPlaceholder: 'e.g. P6A',
    candidateLabel: 'Candidate / Admission No. (optional)',
    candidatePlaceholder: 'Enter number if available',
    examDateLabel: 'Examination Date',
    answeredOf: 'of 50 questions answered',
    timerLabel: 'Elapsed Time',
    filterAll: 'All 50 Questions',
    filterUnanswered: 'Unanswered Only',
    q2Rule: 'Select exactly two (2) answers for Question 2.',
    submitBtn: 'Submit Exam & Grade',
    submittingBtn: 'Grading & Saving...',
    resetBtn: 'Clear Answers',
    printBtn: 'Print Result Slip',
    errMissingFields: 'Please complete District, Sector, School Name, Student Name, Class, and Exam Date before submitting.',
    errQ2Limit: 'Please select at most two (2) answers for Question 2. Uncheck one option first to change your choice.',
    resultHeading: 'Official Exam Result & Review',
    scoreLabel: 'Total Score',
    accuracyLabel: 'Accuracy',
    timeSpentLabel: 'Time Spent',
    refCodeLabel: 'Submission Reference',
    savedToOfficeNote: 'Recorded centrally for EP Saint Pierre Nkombo Academic Office review.',
    topicBreakdownTitle: 'Performance by Science Topic',
    answerReviewTitle: 'Full 50-Question Answer Review',
    correctLabel: 'Correct',
    incorrectLabel: 'Incorrect',
    correctKeyPrefix: 'Correct answer:',
    allAnsweredNote: 'All 50 questions were answered.',
    unansweredListPrefix: 'Unanswered questions:',
  },
};

const RW_PORTAL: PortalExtrasStrings = {
  pillars: {
    kicker: 'Impamvu ya EP Saint Pierre Nkombo · Inkingi Eshatu',
    heading: 'Kwiga uyu munsi, kuyobora ejo mu Kagari ka Bugarura',
    items: [
      {
        index: '01.',
        title: 'Uburezi Bufite Ireme',
        description:
          'Urufatiro rukomeye mu gusoma, imibare, ubumenyi n’indimi eshatu bishyigikiwe n’imyiteguro y’ikizamini cya Leta cya P6.',
      },
      {
        index: '02.',
        title: 'Ubufatanye n’Umuryango',
        description:
          'Imikoranire ya hafi hagati y’ababyeyi n’abarimu mu Kagari ka Bugarura n’Umurenge wa Nkombo kugira ngo buri muryango umenye amakuru.',
      },
      {
        index: '03.',
        title: 'Imikurire Yuzuye y’Umwana',
        description:
          'Kwigirira icyizere, gukorera hamwe mu matsinda, ubuhinzi bw’ishuri, korali, siporo n’indangagaciro nziza.',
      },
    ],
  },
  contact: {
    phoneLabel: 'Telefone y’Ishuri',
    callNowLabel: 'Hamagara Ibiro',
    photoConsentNote: 'Icyitonderwa: Amafoto y’abanyeshuri atangazwa habanje kubaho ubwumvikane n’ababyeyi babo.',
    onlineExamQuickLabel: 'Kora Ikizamini cya SET (P6) kuri Interineti',
  },
  exam: {
    kicker: 'Ikizamini cya Leta Gisoza Amashuri Abanza · P6 kuri Interineti',
    heading: 'Ikizamini cya Science & Elementary Technology (SET)',
    intro:
      'Itoze ibibazo 50 by’ikizamini cya P6, urebe amanota ako kanya hamwe n’isuzuma rya buri gice cy’amasomo, kandi wohereze amanota yawe mu biro by’ishuri.',
    startFocusBtn: 'Erekana Ikarita y’Ibibazo',
    exitFocusBtn: 'Hisha Ikarita y’Ibibazo',
    instructionsTitle: 'Amabwiriza y’Ikizamini',
    instructionsBody:
      'Uzuza imyirondoro yawe, hanyuma uhitemo igisubizo kimwe kuri buri kibazo—uretse Ikibazo cya 2 aho ugomba guhitamo ibisubizo bibiri. Kanda Ohereza Ikizamini nurangiza.',
    studentDeckTitle: 'Amakuru y’Umunyeshuri n’Ishuri',
    districtLabel: 'Akarere',
    sectorLabel: 'Umurenge',
    schoolLabel: 'Izina ry’Ishuri',
    studentNameLabel: 'Amazina Yose y’Umunyeshuri',
    studentPlaceholder: 'Andika amazina yawe yose',
    classLabel: 'Umwaka',
    classPlaceholder: 'urugero: P6A',
    candidateLabel: 'Nomero y’Umunyeshuri (bihari)',
    candidatePlaceholder: 'Andika nomero niba uyifite',
    examDateLabel: 'Itariki y’Ikizamini',
    answeredOf: 'ku bibazo 50 byasubijwe',
    timerLabel: 'Igihe Kimaze',
    filterAll: 'Ibibazo 50 Byose',
    filterUnanswered: 'Ibitarasubizwa Gusa',
    q2Rule: 'Hitamo ibisubizo bibiri (2) ku Kibazo cya 2.',
    submitBtn: 'Ohereza Ikizamini',
    submittingBtn: 'Birimo gukosorwa...',
    resetBtn: 'Siba Ibisubizo',
    printBtn: 'Sohora Icyemezo cy’Amanota',
    errMissingFields: 'Nyamuneka uzuza Akarere, Umurenge, Ishuri, Amazina y’Umunyeshuri, Umwaka n’Itariki mbere yo kohereza.',
    errQ2Limit: 'Hitamo ibisubizo bitarenze bibiri (2) ku Kibazo cya 2.',
    resultHeading: 'Amanota n’Isuzuma ry’Ibisubizo',
    scoreLabel: 'Amanota Yose',
    accuracyLabel: 'Ijanisha',
    timeSpentLabel: 'Igihe Wakoresheje',
    refCodeLabel: 'Nomero yo Kohereza',
    savedToOfficeNote: 'Byabitswe mu bubiko bw’ishuri rya EP Saint Pierre Nkombo.',
    topicBreakdownTitle: 'Amanota kuri buri Gice cy’Isomo',
    answerReviewTitle: 'Ibisubizo by’Ibibazo 50 Byose',
    correctLabel: 'Nibyo',
    incorrectLabel: 'Sibyo',
    correctKeyPrefix: 'Igisubizo cy’ukuri:',
    allAnsweredNote: 'Ibibazo 50 byose byasubijwe.',
    unansweredListPrefix: 'Ibibazo bitasubijwe:',
  },
};

const FR_PORTAL: PortalExtrasStrings = {
  pillars: {
    kicker: 'Pourquoi EP Saint Pierre Nkombo · Trois Piliers',
    heading: 'Apprendre aujourd’hui, diriger demain à Bugarura & Nkombo',
    items: [
      {
        index: '01.',
        title: 'Apprentissage de Qualité',
        description:
          'Des bases solides en lecture, calcul, sciences et maîtrise trilingue renforcées par la préparation interactive au P6.',
      },
      {
        index: '02.',
        title: 'Partenariat Communautaire',
        description:
          'Une collaboration étroite parents–enseignants dans la cellule de Bugarura et le secteur de Nkombo.',
      },
      {
        index: '03.',
        title: 'Développement Global de l’Enfant',
        description:
          'Confiance, travail d’équipe, jardin agroécologique, chorale, sport et valeurs citoyennes à l’école et au-delà.',
      },
    ],
  },
  contact: {
    phoneLabel: 'Téléphone de l’École',
    callNowLabel: 'Appeler le Secrétariat',
    photoConsentNote: 'Note : Les photographies des élèves sont publiées avec le consentement des parents et tuteurs.',
    onlineExamQuickLabel: 'Passer l’examen P6 Sciences & Technologie en ligne',
  },
  exam: {
    kicker: 'Examen National de Fin de Primaire · Portail P6 en ligne',
    heading: 'Examen Interactif de Sciences et Technologie (SET)',
    intro:
      'Entraînez-vous avec les 50 questions officielles de Primary 6, filtrez par thème, obtenez une correction instantanée par domaine et enregistrez votre résultat auprès du secrétariat.',
    startFocusBtn: 'Afficher la carte des questions',
    exitFocusBtn: 'Masquer la carte',
    instructionsTitle: 'Consignes de l’examen',
    instructionsBody:
      'Complétez vos informations d’élève, puis choisissez une réponse par question — sauf pour la Question 2 où exactement deux réponses sont requises.',
    studentDeckTitle: 'Informations de l’élève et de l’école',
    districtLabel: 'District',
    sectorLabel: 'Secteur',
    schoolLabel: 'Nom de l’école',
    studentNameLabel: 'Nom complet de l’élève',
    studentPlaceholder: 'Entrez votre nom complet',
    classLabel: 'Classe',
    classPlaceholder: 'ex. P6A',
    candidateLabel: 'N° de candidat (facultatif)',
    candidatePlaceholder: 'Entrez le numéro si disponible',
    examDateLabel: 'Date de l’examen',
    answeredOf: 'sur 50 questions répondues',
    timerLabel: 'Temps écoulé',
    filterAll: 'Toutes les 50 questions',
    filterUnanswered: 'Sans réponse uniquement',
    q2Rule: 'Sélectionnez exactement deux (2) réponses pour la Question 2.',
    submitBtn: 'Soumettre l’examen',
    submittingBtn: 'Correction et enregistrement...',
    resetBtn: 'Effacer les réponses',
    printBtn: 'Imprimer le relevé',
    errMissingFields: 'Veuillez remplir le district, le secteur, l’école, le nom, la classe et la date.',
    errQ2Limit: 'Veuillez sélectionner au maximum deux (2) réponses pour la Question 2.',
    resultHeading: 'Résultat Officiel & Révision',
    scoreLabel: 'Score total',
    accuracyLabel: 'Pourcentage',
    timeSpentLabel: 'Durée',
    refCodeLabel: 'Code de référence',
    savedToOfficeNote: 'Enregistré au bureau académique de EP Saint Pierre Nkombo.',
    topicBreakdownTitle: 'Résultats par thème scientifique',
    answerReviewTitle: 'Corrigé détaillé des 50 questions',
    correctLabel: 'Correct',
    incorrectLabel: 'Incorrect',
    correctKeyPrefix: 'Bonne réponse :',
    allAnsweredNote: 'Toutes les 50 questions ont été répondues.',
    unansweredListPrefix: 'Questions sans réponse :',
  },
};

const SW_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  pillars: {
    kicker: 'Kwa Nini EP Saint Pierre Nkombo · Nguzo Tatu',
    heading: 'Kujifunza leo, kuongoza kesho Bugarura na Nkombo',
    items: [
      {
        index: '01.',
        title: 'Elimu Bora',
        description: 'Misingi imara ya kusoma, hesabu, sayansi na maandalizi ya mtihani wa kitaifa wa P6.',
      },
      {
        index: '02.',
        title: 'Ushirikiano wa Jamii',
        description: 'Ushirikiano wa karibu kati ya wazazi na walimu katika Kata ya Nkombo.',
      },
      {
        index: '03.',
        title: 'Ukuaji Kamili wa Mtoto',
        description: 'Kujiamini, ushirikiano, kilimo cha shule, kwaya, michezo na maadili mema.',
      },
    ],
  },
  contact: {
    phoneLabel: 'Simu ya Shule',
    callNowLabel: 'Piga Simu Ofisini',
    photoConsentNote: 'Kumbuka: Picha za wanafunzi huchapishwa kwa idhini ya wazazi.',
    onlineExamQuickLabel: 'Fanya Mtihani wa Sayansi P6 Mtandaoni',
  },
  exam: {
    ...EN_PORTAL.exam,
    kicker: 'Mtihani wa Taifa wa Darasa la Sita (P6)',
    heading: 'Mtihani wa Sayansi na Teknolojia (SET)',
    submitBtn: 'Wasilisha Mtihani',
    resetBtn: 'Futa Majibu',
    printBtn: 'Chapisha Matokeo',
    answeredOf: 'kati ya maswali 50 yamejibiwa',
  },
};

const DE_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  pillars: {
    kicker: 'EP Saint Pierre Nkombo · Drei Grundpfeiler',
    heading: 'Heute lernen, morgen führen in Bugarura & am Kivusee',
    items: [
      {
        index: '01.',
        title: 'Qualitätsbildung',
        description: 'Starke Grundlagen in Lesen, Mathematik, Naturwissenschaften und P6-Prüfungsvorbereitung.',
      },
      {
        index: '02.',
        title: 'Schulgemeinschaft',
        description: 'Enge Zusammenarbeit zwischen Eltern und Lehrkräften in der Zelle Bugarura.',
      },
      {
        index: '03.',
        title: 'Ganzheitliche Förderung',
        description: 'Teamarbeit, Schulgarten, Chor, Sport und soziale Verantwortung.',
      },
    ],
  },
  contact: {
    phoneLabel: 'Schultelefon',
    callNowLabel: 'Schulbüro anrufen',
    photoConsentNote: 'Hinweis: Fotos von Schülerinnen und Schülern werden mit Einverständnis der Eltern veröffentlicht.',
    onlineExamQuickLabel: 'P6 Naturwissenschaften Online-Prüfung starten',
  },
  exam: {
    ...EN_PORTAL.exam,
    heading: 'Interaktive Naturwissenschafts-Prüfung (P6 SET)',
    submitBtn: 'Prüfung abgeben',
    resetBtn: 'Antworten löschen',
    printBtn: 'Ergebnis drucken',
    answeredOf: 'von 50 Fragen beantwortet',
  },
};

const ES_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  pillars: {
    kicker: 'Por qué EP Saint Pierre Nkombo · Tres Pilares',
    heading: 'Aprender hoy, liderar mañana en Bugarura y Nkombo',
    items: [
      {
        index: '01.',
        title: 'Aprendizaje de Calidad',
        description: 'Bases sólidas en lectura, matemáticas, ciencias y preparación interactiva para P6.',
      },
      {
        index: '02.',
        title: 'Alianza Comunitaria',
        description: 'Colaboración cercana entre familias y docentes en la célula de Bugarura.',
      },
      {
        index: '03.',
        title: 'Desarrollo Integral',
        description: 'Confianza, trabajo en equipo, huerto escolar, coro, deportes y valores.',
      },
    ],
  },
  contact: {
    phoneLabel: 'Teléfono Escolar',
    callNowLabel: 'Llamar a la Escuela',
    photoConsentNote: 'Nota: Las fotografías de estudiantes se publican con el consentimiento de las familias.',
    onlineExamQuickLabel: 'Realizar examen en línea P6 de Ciencias',
  },
  exam: {
    ...EN_PORTAL.exam,
    heading: 'Examen Interactivo de Ciencias y Tecnología (P6 SET)',
    submitBtn: 'Enviar examen',
    resetBtn: 'Borrar respuestas',
    printBtn: 'Imprimir resultado',
    answeredOf: 'de 50 preguntas respondidas',
  },
};

const IT_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  pillars: {
    kicker: 'EP Saint Pierre Nkombo · Tre Pilastri',
    heading: 'Imparare oggi, guidare domani a Bugarura e Nkombo',
    items: [
      {
        index: '01.',
        title: 'Apprendimento di Qualità',
        description: 'Solide basi in lettura, matematica, scienze e preparazione agli esami nazionali P6.',
      },
      {
        index: '02.',
        title: 'Collaborazione Comunitaria',
        description: 'Stretto dialogo tra genitori e insegnanti nella cellula di Bugarura.',
      },
      {
        index: '03.',
        title: 'Crescita Completa',
        description: 'Fiducia, orto scolastico, coro, sport e valori educativi dentro e fuori la classe.',
      },
    ],
  },
  contact: {
    phoneLabel: 'Telefono della Scuola',
    callNowLabel: 'Chiama la Segreteria',
    photoConsentNote: 'Nota: Le foto degli alunni sono pubblicate con il consenso dei genitori.',
    onlineExamQuickLabel: 'Avvia Esame Online di Scienze P6',
  },
  exam: {
    ...EN_PORTAL.exam,
    heading: 'Esame Interattivo di Scienze e Tecnologia (P6 SET)',
    submitBtn: 'Invia esame',
    resetBtn: 'Cancella risposte',
    printBtn: 'Stampa risultato',
    answeredOf: 'su 50 domande risposte',
  },
};

const PT_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  pillars: {
    kicker: 'EP Saint Pierre Nkombo · Três Pilares',
    heading: 'Aprender hoje, liderar amanhã em Bugarura e Nkombo',
    items: [
      {
        index: '01.',
        title: 'Ensino de Qualidade',
        description: 'Bases fortes em leitura, matemática, ciências e preparação para o exame nacional P6.',
      },
      {
        index: '02.',
        title: 'Parceria Comunitária',
        description: 'Colaboração próxima entre pais e professores em Bugarura e Nkombo.',
      },
      {
        index: '03.',
        title: 'Desenvolvimento Integral',
        description: 'Confiança, trabalho em equipa, horta escolar, coral, desporto e cidadania.',
      },
    ],
  },
  contact: {
    phoneLabel: 'Telefone da Escola',
    callNowLabel: 'Ligar para a Escola',
    photoConsentNote: 'Nota: As fotografias dos alunos são publicadas com autorização dos encarregados de educação.',
    onlineExamQuickLabel: 'Fazer Exame Online de Ciências P6',
  },
  exam: {
    ...EN_PORTAL.exam,
    heading: 'Exame Interativo de Ciências e Tecnologia (P6 SET)',
    submitBtn: 'Submeter exame',
    resetBtn: 'Limpar respostas',
    printBtn: 'Imprimir resultado',
    answeredOf: 'de 50 perguntas respondidas',
  },
};

const NL_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  contact: {
    phoneLabel: 'Telefoonnummer School',
    callNowLabel: 'Bel het Schoolkantoor',
    photoConsentNote: 'Opmerking: Foto’s van leerlingen worden geplaatst met toestemming van ouders.',
    onlineExamQuickLabel: 'Start P6 Wetenschap Online Examen',
  },
  exam: {
    ...EN_PORTAL.exam,
    heading: 'Interactief Examen Wetenschap & Technologie (P6 SET)',
    submitBtn: 'Examen indienen',
    resetBtn: 'Antwoorden wissen',
    printBtn: 'Resultaat afdrukken',
    answeredOf: 'van 50 vragen beantwoord',
  },
};

const PL_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  contact: {
    phoneLabel: 'Telefon Szkoły',
    callNowLabel: 'Zadzwoń do Sekretariatu',
    photoConsentNote: 'Uwaga: Zdjęcia uczniów publikowane są za zgodą rodziców.',
    onlineExamQuickLabel: 'Rozwiąż Egzamin Online P6',
  },
  exam: {
    ...EN_PORTAL.exam,
    heading: 'Interaktywny Egzamin z Nauk Przyrodniczych (P6 SET)',
    submitBtn: 'Wyślij egzamin',
    resetBtn: 'Wyczyść odpowiedzi',
    printBtn: 'Drukuj wynik',
    answeredOf: 'z 50 pytań rozwiązanych',
  },
};

const SV_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  contact: {
    phoneLabel: 'Skolans Telefon',
    callNowLabel: 'Ring Skolkontoret',
    photoConsentNote: 'Obs: Elevfoton publiceras med vårdnadshavares samtycke.',
    onlineExamQuickLabel: 'Gör P6 Naturvetenskap Onlineprov',
  },
  exam: {
    ...EN_PORTAL.exam,
    heading: 'Interaktivt Prov i Naturvetenskap & Teknik (P6 SET)',
    submitBtn: 'Skicka in prov',
    resetBtn: 'Rensa svar',
    printBtn: 'Skriv ut resultat',
    answeredOf: 'av 50 frågor besvarade',
  },
};

const EL_PORTAL: PortalExtrasStrings = {
  ...EN_PORTAL,
  contact: {
    phoneLabel: 'Τηλέφωνο Σχολείου',
    callNowLabel: 'Καλέστε τη Διεύθυνση',
    photoConsentNote: 'Σημείωση: Οι φωτογραφίες μαθητών δημοσιεύονται με συγκατάθεση γονέων.',
    onlineExamQuickLabel: 'Ξεκινήστε το Διαδικτυακό Διαγώνισμα P6',
  },
  exam: {
    ...EN_PORTAL.exam,
    heading: 'Διαδραστική Εξέταση Φυσικών Επιστημών (P6 SET)',
    submitBtn: 'Υποβολή εξέτασης',
    resetBtn: 'Εκκαθάριση απαντήσεων',
    printBtn: 'Εκτύπωση αποτελέσματος',
    answeredOf: 'από 50 ερωτήσεις απαντήθηκαν',
  },
};

export const PORTAL_EXTRAS: Record<LanguageCode, PortalExtrasStrings> = {
  en: EN_PORTAL,
  rw: RW_PORTAL,
  fr: FR_PORTAL,
  sw: SW_PORTAL,
  de: DE_PORTAL,
  es: ES_PORTAL,
  it: IT_PORTAL,
  pt: PT_PORTAL,
  nl: NL_PORTAL,
  pl: PL_PORTAL,
  sv: SV_PORTAL,
  el: EL_PORTAL,
};
