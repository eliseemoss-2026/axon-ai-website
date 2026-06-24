/**
 * Axon AI — bilingual (EN/FR) i18n engine, shared by index.html, contact.html
 * and offre.html.
 *
 * Design:
 *  - English is the default. We NEVER auto-detect the browser language;
 *    a fresh visitor always starts in English. The only way into French is
 *    the visible nav toggle (or a previously persisted choice).
 *  - The chosen language is stored in localStorage under "axon_lang".
 *  - Switching is instant and client-side: we walk every [data-i18n*] node,
 *    swap its text/attribute, update <html lang>, and fire "axon:langchange"
 *    so the chat widget can re-render its UI and tell the backend which
 *    language to answer in.
 *
 * Markup contract (already present in the HTML):
 *    data-i18n="key"            → replaces element.textContent
 *    data-i18n-html="key"       → replaces element.innerHTML (for strings with <br>/<span>)
 *    data-i18n-attr + data-i18n-key → replaces the named attribute (e.g. content, aria-label, placeholder)
 *
 * Any key missing from the FR table falls back to the live English text that
 * was baked into the page, so a forgotten string degrades gracefully rather
 * than rendering "undefined".
 */
(function () {
  "use strict";

  var STORAGE_KEY = "axon_lang";

  // ── French translations. English is the source of truth in the HTML; this
  //    table only holds the FR side. Keys are shared across all three pages. ──
  var FR = {
    /* meta / nav */
    title: "John Marrion — Fondateur, Axon AI",
    title_contact: "Contact — Axon AI",
    title_offre: "Votre offre — Axon AI",
    meta_desc: "Axon AI aide les entreprises à se développer grâce à l'IA — stratégie, automatisation, agents IA sur mesure et sites web. Fondée par John Marrion. Réservez un appel stratégique gratuit.",
    lang_aria: "Changer la langue entre l'anglais et le français",
    theme_aria: "Basculer entre le mode sombre et clair",
    menu_aria: "Ouvrir le menu",
    nav_services: "Services",
    nav_process: "Méthode",
    nav_why: "Pourquoi moi",
    nav_faq: "FAQ",
    nav_contact: "Contact",
    nav_home: "Accueil",
    nav_cta: "🤖 Réserver un appel",

    /* hero */
    hero_eyebrow: "🤖 Disponible pour vos projets IA",
    hero_title: "Fondateur & Consultant Principal · Axon AI",
    hero_desc: "J'aide les entreprises à exploiter toute la puissance de l'IA — de la stratégie à la mise en œuvre, jusqu'à l'automatisation sur mesure. Transformez la complexité en avantage concurrentiel.",
    cta_book_strategy: "Réserver un appel stratégique gratuit",
    hero_explore: "Découvrir les services",
    badge1_text: "Intégration GPT-4",
    badge1_sub: "En production",
    badge2_text: "85 % de coûts en moins",
    badge2_sub: "Résultat client moyen",
    badge3_sub: "Sous 90 jours",

    /* ticker */
    tick_strategy: "Stratégie IA",
    tick_automation: "Automatisation des processus",
    tick_llm: "Intégration de LLM",
    tick_chatgpt: "ChatGPT & Claude",
    tick_tools: "Outils IA sur mesure",
    tick_data: "Analyse de données",
    tick_training: "Formation des équipes à l'IA",
    tick_workflow: "Conception de workflows 🤖",

    /* stats */
    stats_label: "Résultats",
    stats_title: "Des chiffres qui prouvent l'impact",
    stat1: "Entreprises transformées par l'IA",
    stat2: "Économisés en opérations chaque année",
    stat3: "Taux de fidélisation client",
    stat4: "ROI moyen sous 90 jours",

    /* services */
    services_label: "Ce que je fais",
    services_title: "Des services IA conçus pour<br>de vrais résultats business",
    svc1_title: "Stratégie & feuille de route IA",
    svc1_desc: "Audit approfondi de vos opérations. J'identifie chaque opportunité IA à fort ROI et je livre une feuille de route priorisée et progressive, avec des KPI et des échéances claires.",
    tag_popular: "Le plus populaire",
    svc2_title: "Automatisation des workflows",
    svc2_desc: "Éliminez les tâches répétitives dans les ventes, les opérations et le support. Une automatisation pilotée par l'IA, active 24h/24 et 7j/7, sans recruter.",
    tag_highroi: "ROI élevé",
    svc3_title: "Intégration LLM & GPT",
    svc3_desc: "Déploiements sur mesure de GPT-4, Claude et de LLM open source. Des assistants et agents intelligents intégrés directement à votre stack existante.",
    tag_technical: "Technique",
    svc4_title: "Analytique & insights IA",
    svc4_desc: "Transformez vos données brutes en intelligence prédictive. Tableaux de bord sur mesure, détection d'anomalies et prévisions pilotées par l'IA pour décider plus vite.",
    svc5_title: "Formation des équipes à l'IA",
    svc5_desc: "Faites monter en compétence toute votre équipe pour travailler avec l'IA en confiance. Ateliers, playbooks et sessions pratiques adaptés à votre secteur.",
    svc6_title: "Solutions IA sur mesure",
    svc6_desc: "Des produits IA sur mesure pour les problèmes qu'aucun outil standard ne résout. Du prototype à la production — entièrement à vous, intégré et opérationnel.",

    /* automation showcase */
    auto_label: "L'IA en action",
    auto_title: "À quoi ressemble l'automatisation IA<br>dans la pratique",
    wf_leadin: "📥 Lead entrant",
    wf_classify: "🤖 Tri par l'IA",
    wf_reply: "✉️ Réponse auto",
    wf_book: "📅 Prise de RDV",
    aicard1_title: "⚡ Automatisation du workflow commercial",
    aicard1_desc: "Chaque lead est qualifié, recontacté et converti en rendez-vous — automatiquement. Aucun effort manuel pour votre équipe.",
    chat_q1: "Comment réinitialiser mon mot de passe ?",
    chat_a1: "🤖 Je peux vous aider ! Cliquez sur « Mot de passe oublié » sur la page de connexion et nous vous enverrons un lien de réinitialisation en quelques secondes.",
    chat_q2: "Quels sont vos horaires d'ouverture ?",
    aicard2_title: "🤖 Assistant support IA 24h/24",
    aicard2_desc: "Traitez 80 % des demandes clients instantanément — nuits, week-ends, jours fériés. Aucune attente, aucun effectif supplémentaire.",
    bar_revenue: "CA",
    bar_leads: "Leads",
    bar_savings: "Économies",
    bar_churn: "Attrition ↓",
    aicard3_title: "📊 Analytique pilotée par l'IA",
    aicard3_desc: "Des tableaux de bord prédictifs qui anticipent les tendances, signalent les anomalies et font remonter les insights avant que les problèmes n'apparaissent.",

    /* who */
    who_label: "Avec qui je travaille",
    who_title: "L'IA donne à chaque type d'entreprise<br>un avantage décisif",
    who1_title: "Startups",
    who1_desc: "Avancez plus vite grâce à des opérations nativement pilotées par l'IA dès le premier jour. Rivalisez à grande échelle sans gonfler vos effectifs.",
    who2_title: "PME",
    who2_desc: "Identifiez vos opportunités d'automatisation à plus fort levier et déployez-les sans aucune perturbation.",
    who3_title: "Grandes entreprises",
    who3_desc: "Transformation IA à grande échelle, avec gouvernance, sécurité et conduite du changement intégrées.",
    who4_title: "Agences",
    who4_desc: "Des pipelines de contenu, de reporting et de livraison pilotés par l'IA, qui démultiplient votre capacité sans agrandir votre équipe.",
    who5_title: "E-commerce",
    who5_desc: "Recommandations pilotées par l'IA, tarification dynamique et support automatisé qui transforment les visiteurs en clients fidèles.",
    who6_title: "Services professionnels",
    who6_desc: "Automatisez le traitement documentaire, l'accueil client, la recherche et le reporting — récupérez des heures facturables à grande échelle.",
    quote_text: "John n'a pas seulement déployé des outils IA — il a transformé la façon dont toute notre équipe pense et travaille. Nous avons réduit nos délais de livraison de 60 % et augmenté notre chiffre d'affaires de 40 % dès le premier trimestre.",
    quote_author: "— Sarah Chen, COO chez Meridian Analytics",

    /* process */
    process_label: "Comment ça marche",
    process_title: "Du premier appel à<br>la transformation IA complète",
    step1_title: "Découverte & audit IA",
    step1_desc: "Nous cartographions chaque workflow, chaque goulot d'étranglement et chaque source de données de votre entreprise. J'identifie les opportunités IA classées par ROI et complexité — pour attaquer les meilleures en premier.",
    step2_title: "Stratégie & feuille de route",
    step2_desc: "Un plan de transformation IA détaillé et progressif, avec des livrables, des échéances et des retours sur investissement projetés. Pas de slides vagues — un vrai plan exécutable immédiatement.",
    step3_title: "Construire, lancer & optimiser",
    step3_desc: "Mise en œuvre concrète, tests et formation des équipes. Je reste présent jusqu'à la mise en production et au-delà pour optimiser les performances et garantir une réelle adoption.",
    ae_label: "⚡ CŒUR ÉNERGÉTIQUE IA",
    whybadge1_text: "Consultant IA",
    whybadge1_sub: "Depuis 2019",
    whybadge2_text: "50+ clients",
    whybadge2_sub: "Dans le monde entier",

    /* why me */
    why_label: "Pourquoi me choisir",
    why_title: "Vous travaillez avec moi.<br>Pas avec une équipe de juniors.",
    why_desc: "Les grandes agences vous délèguent à d'autres dès la signature. Avec moi, chaque appel stratégique, chaque ligne de mise en œuvre, chaque session de formation — c'est moi, personnellement, entièrement concentré sur vos résultats.",
    why_cred1: "5+ ans à déployer l'IA dans plus de 50 entreprises",
    why_cred2: "De solides compétences techniques + une vision business claire",
    why_cred3: "Remote-first, disponible sur tous les fuseaux horaires",
    why_cred4: "Trilingue : anglais, français & mandarin",
    why_cred5: "Certifié sur GPT-4, LangChain & l'automatisation n8n",

    /* comparison */
    comp_need: "Ce dont vous avez besoin",
    comp_agency: "Big 4 / Agence",
    comp_diy: "En interne / DIY",
    comp_r1_label: "Stratégie IA claire avec projections de ROI",
    comp_r1_a: "Livrée dès la semaine 1",
    comp_r1_b: "Après des mois",
    comp_r1_c: "Non définie",
    comp_r2_label: "Mise en œuvre concrète (pas que des slides)",
    comp_r2_a: "Toujours",
    comp_r2_b: "Sous-traitée",
    comp_r2_c: "Si le talent est dispo",
    comp_r3_label: "Abordable pour les PME et les startups",
    comp_r3_a: "Oui",
    comp_r3_b: "Forfaits à 200 K$+",
    comp_r3_c: "Coûts cachés",
    comp_r4_label: "Opérationnel en semaines, pas en trimestres",
    comp_r4_a: "2 à 6 semaines en général",
    comp_r4_b: "Cycles de 6 à 18 mois",
    comp_r4_c: "Imprévisible",
    comp_r5_label: "Une attention senior sur votre projet",
    comp_r5_a: "Vous travaillez directement avec moi",
    comp_r5_b: "Personnel junior",
    comp_r5_c: "Si bien recruté",
    comp_r6_label: "Formation des équipes & transfert de savoir",
    comp_r6_a: "Toujours inclus",
    comp_r6_b: "En supplément",
    comp_r6_c: "En autodidacte",

    /* testimonials */
    testi_label: "Résultats clients",
    testi_title: "Ce que disent les entreprises<br>après avoir travaillé avec moi",
    testi1_text: "Nous étions sceptiques face à l'IA, mais John nous a guidés à chaque étape. En 6 semaines, notre support client était automatisé à 80 % et l'équipe pouvait se concentrer sur les tâches à forte valeur.",
    testi1_role: "PDG, Nova Commerce",
    testi2_text: "Le ROI a été incroyable. John nous a construit un pipeline IA sur mesure pour la génération de propositions qui nous fait gagner 15 heures par dossier. À notre volume, ça change tout.",
    testi2_role: "Associé, Apex Strategy Group",
    testi3_text: "La plupart des consultants vous livrent un slide deck. John nous a livré des systèmes qui fonctionnent. Notre transformation IA était en production et mesurable en 4 semaines tout juste. Vraiment exceptionnel.",
    testi3_role: "CTO, Luminary Health",

    /* faq */
    faq_label: "Questions",
    faq_title: "Tout ce que vous devez savoir<br>avant qu'on en parle",
    faq1_q: "Avec quels types d'entreprises travaillez-vous ?",
    faq1_a: "Je travaille avec des startups, des PME et des grandes entreprises, tous secteurs confondus — de l'e-commerce et du SaaS aux services professionnels, à la santé et à la finance. Si votre entreprise a des processus répétitifs, des données ou des interactions clients, l'IA peut vous aider.",
    faq2_q: "Ai-je besoin d'une équipe technique pour travailler avec vous ?",
    faq2_a: "Non. Je gère moi-même toute la mise en œuvre technique et je traduis tout en langage clair. Beaucoup de mes meilleurs clients n'ont aucun profil technique. Je construis des systèmes que votre équipe actuelle peut piloter sans développeur.",
    faq3_q: "À quelle vitesse vais-je voir des résultats ?",
    faq3_a: "La plupart des clients constatent des résultats mesurables dès les 2 à 4 premières semaines. Je priorise volontairement les gains rapides pour que vous puissiez démontrer le ROI en interne avant même la fin de la transformation.",
    faq4_q: "À quoi ressemble une mission type et combien ça coûte ?",
    faq4_a: "Les missions vont d'un audit IA ciblé de 2 semaines (3 000 à 5 000 $) à des projets de transformation complets sur 3 à 6 mois. Je propose aussi des forfaits mensuels pour un accompagnement stratégique continu. Tout commence par un appel découverte gratuit de 30 minutes.",
    faq5_q: "En quoi est-ce différent d'embaucher un développeur IA ?",
    faq5_a: "Un développeur construit ce que vous spécifiez. Moi, je vous aide à définir quoi construire, pourquoi et dans quel ordre — puis je le construis. Vous obtenez la stratégie, la priorisation et la mise en œuvre dans un seul package.",
    faq6_q: "L'IA va-t-elle remplacer mon équipe ?",
    faq6_a: "Presque jamais. L'objectif est d'éliminer les parties ennuyeuses et répétitives du travail de chacun pour que vos équipes se concentrent sur le créatif et le stratégique. Mes clients rapportent systématiquement une plus grande satisfaction au travail après le déploiement de l'IA.",

    /* CTA banner */
    cta_title: "Prêt à bâtir votre avantage IA ?",
    cta_desc: "Réservez un appel stratégique gratuit de 30 minutes — sans pitch, sans pression. Juste une vision claire de là où l'IA peut faire la différence pour votre entreprise.",
    cta_book_strategy_btn: "Réserver un appel stratégique gratuit",
    cta_send_msg: "Envoyer un message",

    /* footer */
    footer_copy: "© 2025 <span class=\"footer-em\">Axon AI</span> · Dirigée par John Marrion. Tous droits réservés.",
    footer_loc: "Remote · Partout dans le monde",

    /* ── contact page ── */
    contact_eyebrow: "🤖 Bâtissons votre avantage IA",
    contact_title_pre: "Entrons en ",
    contact_title_hl: "contact",
    contact_sub: "Un projet en tête, une question sur l'IA, ou simplement envie d'explorer ce qui est possible ? Je réponds sous 24 heures.",
    contact_info_title: "Prêt à en parler ?",
    contact_info_sub: "Que vous exploriez encore l'IA ou que vous soyez prêt à lancer un projet — chaque échange commence par un simple message ou un appel gratuit de 30 minutes.",
    ci_whatsapp: "WhatsApp · Téléphone",
    ci_email: "E-mail",
    ci_location: "Localisation",
    ci_location_val: "Remote · Partout dans le monde",
    cal_cta_text: "Vous préférez échanger directement ? Réservez un appel stratégique gratuit de 30 minutes et cartographions ensemble votre opportunité IA.",
    cal_cta_btn: "Réserver un appel gratuit — sans pitch",
    form_success_title: "Message envoyé !",
    form_success_desc: "Merci de votre message. John vous répondra sous 24 heures.",
    form_error: "⚠️ Une erreur est survenue. Merci de nous écrire directement par e-mail.",
    form_error_required: "⚠️ Merci de remplir tous les champs obligatoires.",
    form_label_name: "Votre nom *",
    form_ph_name: "Nom complet",
    form_label_email: "E-mail *",
    form_ph_email: "vous@entreprise.com",
    form_label_company: "Entreprise",
    form_ph_company: "Nom de l'entreprise",
    form_label_service: "Service souhaité",
    form_opt_select: "Choisir un service",
    form_opt_strategy: "Stratégie & feuille de route IA",
    form_opt_automation: "Automatisation des workflows",
    form_opt_llm: "Intégration LLM & GPT",
    form_opt_analytics: "Analytique IA",
    form_opt_training: "Formation des équipes à l'IA",
    form_opt_custom: "Solution IA sur mesure",
    form_opt_notsure: "Je ne sais pas encore",
    form_label_msg: "Parlez-moi de votre projet *",
    form_ph_msg: "Que cherchez-vous à résoudre ? À quoi ressemble le succès pour vous ?",
    form_submit: "Envoyer le message 🤖",
    form_sending: "Envoi…",

    /* ── offre page (private per-prospect quote, USD prices kept as-is) ── */
    offre_h1_pre: "Choisissez votre ",
    offre_h1_hl: "formule",
    offre_intro: "Merci pour votre confiance ! Voici les trois options pour votre projet. Sélectionnez celle qui vous correspond — votre choix m'est envoyé directement et nous en reparlons lors de notre appel.",
    offre_c1_title: "Une page web",
    offre_c1_desc: "Une page unique, moderne et soignée — idéale pour une landing page, une présentation ou un produit.",
    offre_c2_title: "Site web complet",
    offre_c2_desc: "Un site multi-pages complet, rapide et sécurisé, déployé et prêt à l'emploi (sans agent IA).",
    offre_c3_badge: "Offre remisée",
    offre_c3_title: "Site web + Agent IA",
    offre_c3_desc: "Un site complet accompagné d'un agent IA conversationnel qui répond à vos clients 24h/24, en français, et capte les demandes — installé et géré pour vous.",
    offre_choose: "Choisir cette formule →",
    offre_note: "Vous hésitez ? Pas d'inquiétude — nous en discuterons ensemble lors de notre appel pour trouver la meilleure option.",

    /* ── chat widget UI ── */
    widget_greeting: "Bonjour ! Je suis l'assistant Axon AI. Posez-moi vos questions sur nos agents IA conversationnels 👋",
    widget_placeholder: "Écrivez un message…",
    widget_send: "Envoyer",
    widget_open_aria: "Ouvrir le chat avec ",
    widget_close_aria: "Fermer le chat",
    widget_error: "Désolé, une erreur est survenue. Merci de réessayer.",
    widget_offline: "Désolé, je n'ai pas pu me connecter. Merci de réessayer dans un instant.",
  };

  // English fallbacks for widget-only strings (the widget builds its own DOM,
  // so these aren't baked into the page like the [data-i18n] nodes are).
  var EN_WIDGET = {
    widget_greeting: "Hi! I'm the Axon AI assistant. Ask me anything about our AI chat agents 👋",
    widget_placeholder: "Type a message…",
    widget_send: "Send",
    widget_open_aria: "Open chat with ",
    widget_close_aria: "Close chat",
    widget_error: "Sorry, something went wrong. Please try again.",
    widget_offline: "Sorry, I couldn't connect. Please try again in a moment.",
  };

  function getLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "fr" ? "fr" : "en";
    } catch (e) {
      return "en";
    }
  }

  // Public lookup used by the widget. Returns FR string when in FR mode,
  // otherwise the English fallback (widget strings) — pages use baked-in EN.
  function t(key) {
    if (getLang() === "fr" && FR[key] != null) return FR[key];
    if (EN_WIDGET[key] != null) return EN_WIDGET[key];
    return FR[key] != null ? FR[key] : key;
  }

  // Walk the DOM and apply the active language. In EN mode we restore the
  // original English text we captured on first run.
  function apply(lang) {
    var nodes = document.querySelectorAll("[data-i18n],[data-i18n-html],[data-i18n-attr]");
    nodes.forEach(function (el) {
      // text content
      var key = el.getAttribute("data-i18n");
      if (key) setText(el, key, lang, false);

      var htmlKey = el.getAttribute("data-i18n-html");
      if (htmlKey) setText(el, htmlKey, lang, true);

      // attribute (content / aria-label / placeholder / …)
      var attr = el.getAttribute("data-i18n-attr");
      var attrKey = el.getAttribute("data-i18n-key");
      if (attr && attrKey) setAttr(el, attr, attrKey, lang);
    });
    document.documentElement.lang = lang;
  }

  function setText(el, key, lang, asHtml) {
    var store = asHtml ? "_enHtml" : "_enText";
    // Capture the English original once, the first time we touch this node.
    if (el.dataset[store] === undefined) {
      el.dataset[store] = asHtml ? el.innerHTML : el.textContent;
    }
    var value = lang === "fr" && FR[key] != null ? FR[key] : el.dataset[store];
    if (asHtml) el.innerHTML = value;
    else el.textContent = value;
  }

  function setAttr(el, attr, key, lang) {
    var store = "_en_" + attr.replace(/[^a-z]/gi, "");
    if (el.dataset[store] === undefined) {
      el.dataset[store] = el.getAttribute(attr) || "";
    }
    var value = lang === "fr" && FR[key] != null ? FR[key] : el.dataset[store];
    el.setAttribute(attr, value);
  }

  function setLang(lang) {
    lang = lang === "fr" ? "fr" : "en";
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* private mode — language still applies for this page view */
    }
    window.AXON_LANG = lang;
    apply(lang);
    // Let the chat widget (and anything else) react.
    window.dispatchEvent(new CustomEvent("axon:langchange", { detail: { lang: lang } }));
  }

  function toggleLang() {
    setLang(getLang() === "fr" ? "en" : "fr");
  }

  // ── expose a tiny public API ──
  window.AXON_LANG = getLang();
  window.AxonI18n = { t: t, getLang: getLang, setLang: setLang, toggle: toggleLang };
  window.axonToggleLang = toggleLang; // referenced by inline onclick in the nav

  // Apply the persisted/default language as soon as the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      apply(getLang());
    });
  } else {
    apply(getLang());
  }
})();
