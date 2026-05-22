(function () {
  "use strict";

  var STORAGE_KEY = "humanidadesQuiz.progress.v1";
  var EXAM_SIZE = 70;
  var DEFAULT_WEIGHT = 3;
  var MIN_WEIGHT = 1;
  var MAX_WEIGHT = 12;
  var APP_VERSION = "2026-05-22-visual-real-only-v3";
  var USE_DEMO_ARTWORKS = false;
  var DISCIPLINES_BY_TOPIC = {
    9: "Apropiaciones simbolicas / Antiguedad",
    10: "Arquitectura",
    11: "Escultura",
    12: "Pintura"
  };

  var data = mergeExternalArtworks(window.HQ_DATA || { conceptQuestions: [], artworks: [] });
  var visualDiagnostics = createEmptyVisualDiagnostics();
  var questions = buildQuestions(data);
  var state = loadProgress();
  var session = {
    current: null,
    answered: false,
    mode: "random",
    examIds: [],
    examIndex: 0
  };

  var els = {
    topicSelect: document.getElementById("topicSelect"),
    topicSection: document.getElementById("topicSection"),
    examSection: document.getElementById("examSection"),
    examCounter: document.getElementById("examCounter"),
    examProgress: document.getElementById("examProgress"),
    questionTopic: document.getElementById("questionTopic"),
    questionType: document.getElementById("questionType"),
    questionImage: document.getElementById("questionImage"),
    questionText: document.getElementById("questionText"),
    answers: document.getElementById("answers"),
    feedback: document.getElementById("feedback"),
    nextBtn: document.getElementById("nextBtn"),
    resetBtn: document.getElementById("resetBtn"),
    exportBtn: document.getElementById("exportBtn"),
    importBtn: document.getElementById("importBtn"),
    importInput: document.getElementById("importInput"),
    totalCorrect: document.getElementById("totalCorrect"),
    totalWrong: document.getElementById("totalWrong"),
    accuracy: document.getElementById("accuracy"),
    weakTopic: document.getElementById("weakTopic"),
    mostMissedList: document.getElementById("mostMissedList"),
    questionCount: document.getElementById("questionCount"),
    appVersion: document.getElementById("appVersion"),
    realVisualCount: document.getElementById("realVisualCount"),
    demoVisualExcluded: document.getElementById("demoVisualExcluded"),
    metadataVisualExcluded: document.getElementById("metadataVisualExcluded"),
    extractedImageCount: document.getElementById("extractedImageCount")
  };

  init();

  function init() {
    ensureQuestionStats();
    populateTopics();
    bindEvents();
    updateStats();
    updateDiagnostics();
    nextQuestion();
    registerServiceWorker();
  }

  function buildQuestions(source) {
    var manual = (source.conceptQuestions || []).map(normalizeManualQuestion);
    var artQuestions = buildArtworkQuestions(source.artworks || []);
    return manual.concat(artQuestions).filter(Boolean);
  }

  function mergeExternalArtworks(source) {
    var base = {
      conceptQuestions: source.conceptQuestions || [],
      artworks: (source.artworks || []).slice()
    };
    var external = getExtractedArtworks();

    external.forEach(function (art) {
      if (art && art.id && shouldUseArtwork(art)) {
        base.artworks.push(art);
      }
    });

    return base;
  }

  function getExtractedArtworks() {
    if (typeof extractedArtworks !== "undefined" && Array.isArray(extractedArtworks)) {
      return extractedArtworks;
    }
    if (Array.isArray(window.extractedArtworks)) {
      return window.extractedArtworks;
    }
    return [];
  }

  function shouldUseArtwork(art) {
    if (!Object.prototype.hasOwnProperty.call(art, "usar_en_quiz")) {
      return true;
    }

    var value = art.usar_en_quiz;
    if (typeof value === "boolean") {
      return value;
    }

    return ["", "no", "false", "0"].indexOf(String(value).trim().toLowerCase()) === -1;
  }

  function normalizeManualQuestion(q) {
    if (!q || !q.id || !q.pregunta || !Array.isArray(q.respuestas) || q.respuestas.length !== 4) {
      return null;
    }

    return {
      id: q.id,
      topic: q.tema || "General",
      type: "Concepto",
      text: q.pregunta,
      answers: q.respuestas.slice(0, 4),
      correctIndex: Number(q.correcta) || 0,
      image: q.imagen || "",
      source: "manual"
    };
  }

  function buildArtworkQuestions(artworks) {
    return buildStrictArtworkQuestions(artworks);


  }

  function buildStrictArtworkQuestions(artworks) {
    var normalizedArtworks = artworks.map(normalizeArtwork).filter(Boolean);
    var eligibleArtworks = normalizedArtworks.filter(isAllowedVisualArtwork);
    var generated = [];

    visualDiagnostics = calculateVisualDiagnostics(normalizedArtworks, eligibleArtworks);

    eligibleArtworks.forEach(function (art) {
      generated.push(makeStrictVisualQuestion(
        art,
        "autor",
        "Quien es el autor de esta obra?",
        art.autor,
        eligibleArtworks
      ));
      generated.push(makeStrictVisualQuestion(
        art,
        "fecha",
        "En que fecha o periodo se realizo esta obra?",
        art.fecha,
        eligibleArtworks
      ));
      generated.push(makeStrictVisualQuestion(
        art,
        "movimiento",
        "A que movimiento, estilo o periodo artistico pertenece?",
        art.movimiento,
        eligibleArtworks
      ));
    });

    generated = generated.filter(Boolean);
    visualDiagnostics.realValid = countUniqueVisualArtworks(generated);
    return generated;
  }

  function makeStrictVisualQuestion(art, field, prompt, correct, artworks) {
    var correctValue = cleanValue(correct);
    if (!correctValue) {
      return null;
    }

    var answers = makeStrictVisualOptions(art, field, correctValue, artworks);
    if (!answers) {
      return null;
    }

    return {
      id: "obra-" + art.id + "-" + field,
      topic: art.tema || art.disciplina || "Obras de arte",
      type: art.disciplina || "Obra de arte",
      text: prompt,
      answers: answers,
      correctIndex: 0,
      image: getArtworkImage(art),
      isVisual: true,
      artworkId: art.id,
      visualField: field,
      source: "artwork",
      artwork: {
        obra: art.obra,
        autor: art.autor,
        fecha: art.fecha,
        movimiento: art.movimiento,
        notas: art.notas
      }
    };
  }

  function makeStrictVisualOptions(art, field, correct, artworks) {
    var wrongs = [];
    var sameDisciplineAndTopic = filterArtworksForOptions(artworks, art, field, true, true);
    var sameDiscipline = filterArtworksForOptions(artworks, art, field, true, false);
    var sameTopic = filterArtworksForOptions(artworks, art, field, false, true);
    var all = artworks.filter(function (item) {
      return cleanValue(item[field]);
    });

    if (field === "fecha") {
      sameDisciplineAndTopic = sortDatesByDistance(sameDisciplineAndTopic, correct, field);
      sameDiscipline = sortDatesByDistance(sameDiscipline, correct, field);
      sameTopic = sortDatesByDistance(sameTopic, correct, field);
      all = sortDatesByDistance(all, correct, field);
    } else {
      sameDisciplineAndTopic = shuffle(sameDisciplineAndTopic);
      sameDiscipline = shuffle(sameDiscipline);
      sameTopic = shuffle(sameTopic);
      all = shuffle(all);
    }

    addOptionCandidates(wrongs, sameDisciplineAndTopic, field, correct);
    addOptionCandidates(wrongs, sameDiscipline, field, correct);
    addOptionCandidates(wrongs, sameTopic, field, correct);
    addOptionCandidates(wrongs, all, field, correct);

    if (wrongs.length < 3) {
      return null;
    }

    return [correct].concat(wrongs.slice(0, 3));
  }

  function filterArtworksForOptions(artworks, art, field, matchDiscipline, matchTopic) {
    return artworks.filter(function (item) {
      if (!cleanValue(item[field]) || item.id === art.id) {
        return false;
      }
      if (matchDiscipline && item.disciplina !== art.disciplina) {
        return false;
      }
      if (matchTopic && item.tema !== art.tema) {
        return false;
      }
      return true;
    });
  }

  function addOptionCandidates(options, artworks, field, correct) {
    artworks.forEach(function (art) {
      var value = cleanValue(art[field]);
      if (!value || value === correct || options.indexOf(value) !== -1) {
        return;
      }
      options.push(value);
    });
  }

  function sortDatesByDistance(artworks, correct, field) {
    var correctYear = extractComparableYear(correct);
    if (!correctYear) {
      return shuffle(artworks);
    }

    return artworks.slice().sort(function (a, b) {
      var yearA = extractComparableYear(a[field]);
      var yearB = extractComparableYear(b[field]);
      var diffA = yearA ? Math.abs(yearA - correctYear) : Number.MAX_SAFE_INTEGER;
      var diffB = yearB ? Math.abs(yearB - correctYear) : Number.MAX_SAFE_INTEGER;
      return diffA - diffB;
    });
  }

  function extractComparableYear(value) {
    var text = cleanValue(value);
    var match = text.match(/\d{3,4}/);
    return match ? Number(match[0]) : 0;
  }

  function isAllowedVisualArtwork(art) {
    return Boolean(
      art &&
      art.id &&
      shouldUseArtwork(art) &&
      hasRealVisualImage(art) &&
      hasVisualMetadata(art)
    );
  }

  function hasRealVisualImage(art) {
    var image = getArtworkImage(art);
    if (!image) {
      return false;
    }
    return image.indexOf("img/extracted/") === 0 || USE_DEMO_ARTWORKS;
  }

  function isDemoVisualImage(art) {
    var image = getArtworkImage(art);
    return Boolean(image && image.indexOf("img/extracted/") !== 0);
  }

  function isExtractedImage(art) {
    return getArtworkImage(art).indexOf("img/extracted/") === 0;
  }

  function hasVisualMetadata(art) {
    return Boolean(cleanValue(art.autor) || cleanValue(art.fecha) || cleanValue(art.movimiento));
  }

  function createEmptyVisualDiagnostics() {
    return {
      realValid: 0,
      demoExcluded: 0,
      metadataExcluded: 0,
      extractedTotal: 0
    };
  }

  function calculateVisualDiagnostics(artworks, eligibleArtworks) {
    var diagnostics = createEmptyVisualDiagnostics();
    var validArtworkIds = {};

    eligibleArtworks.forEach(function (art) {
      validArtworkIds[art.id] = true;
    });

    diagnostics.realValid = Object.keys(validArtworkIds).length;
    artworks.forEach(function (art) {
      if (!getArtworkImage(art) || !shouldUseArtwork(art)) {
        return;
      }
      if (isExtractedImage(art)) {
        diagnostics.extractedTotal += 1;
        if (!hasVisualMetadata(art)) {
          diagnostics.metadataExcluded += 1;
        }
        return;
      }
      if (isDemoVisualImage(art) && !USE_DEMO_ARTWORKS) {
        diagnostics.demoExcluded += 1;
      }
    });

    return diagnostics;
  }

  function countUniqueVisualArtworks(visualQuestions) {
    var seen = {};
    visualQuestions.forEach(function (question) {
      if (question.artworkId) {
        seen[question.artworkId] = true;
      }
    });
    return Object.keys(seen).length;
  }


  function normalizeArtwork(art) {
    if (!art || !art.id) {
      return null;
    }

    var topicNumber = inferTopicNumber(art);
    var topic = cleanValue(art.tema);
    var discipline = cleanValue(art.disciplina);

    if ((!topic || topic === "Tema sin identificar") && topicNumber) {
      topic = "Tema " + topicNumber;
    }
    if (!discipline && topicNumber && DISCIPLINES_BY_TOPIC[topicNumber]) {
      discipline = DISCIPLINES_BY_TOPIC[topicNumber];
    }

    return {
      id: cleanValue(art.id),
      tema: topic || "Tema sin identificar",
      disciplina: discipline,
      imagen: cleanValue(art.imagen),
      image: cleanValue(art.image),
      obra: cleanValue(art.obra),
      autor: cleanValue(art.autor),
      fecha: cleanValue(art.fecha),
      movimiento: cleanValue(art.movimiento),
      notas: cleanValue(art.notas),
      usar_en_quiz: art.usar_en_quiz,
      sourcePdf: cleanValue(art.sourcePdf),
      page: art.page
    };
  }


  function getArtworkImage(art) {
    return cleanValue(art.imagen || art.image);
  }

  function inferTopicNumber(art) {
    var text = [
      art.tema,
      art.sourcePdf,
      art.id
    ].join(" ").replace(/[+_.-]+/g, " ");
    var match = text.match(/(?:^|\s)(?:tema|t)\s*0?(\d{1,2})(?:\s|$)/i);
    return match ? Number(match[1]) : 0;
  }

  function cleanValue(value) {
    if (value === null || typeof value === "undefined") {
      return "";
    }
    return String(value).trim();
  }


  function uniqueValues(items, key) {
    var seen = {};
    var values = [];

    items.forEach(function (item) {
      var value = item && item[key];
      if (value && !seen[value]) {
        seen[value] = true;
        values.push(value);
      }
    });

    return values;
  }

  function ensureQuestionStats() {
    var validIds = {};

    questions.forEach(function (question) {
      validIds[question.id] = true;
      if (!state.byQuestion[question.id]) {
        state.byQuestion[question.id] = {
          correct: 0,
          wrong: 0,
          streak: 0,
          weight: DEFAULT_WEIGHT
        };
      }
    });

    Object.keys(state.byQuestion).forEach(function (id) {
      if (!validIds[id]) {
        delete state.byQuestion[id];
      }
    });

    saveProgress();
  }

  function populateTopics() {
    var topics = uniqueArray(questions.map(function (q) {
      return q.topic;
    })).sort();

    els.topicSelect.innerHTML = "";
    topics.forEach(function (topic) {
      var option = document.createElement("option");
      option.value = topic;
      option.textContent = topic;
      els.topicSelect.appendChild(option);
    });
    els.questionCount.textContent = questions.length + " preguntas";
  }

  function bindEvents() {
    document.querySelectorAll("input[name='mode']").forEach(function (input) {
      input.addEventListener("change", function () {
        session.mode = input.value;
        if (session.mode === "exam") {
          startExam();
        } else {
          session.examIds = [];
          session.examIndex = 0;
          nextQuestion();
        }
        updateModePanels();
      });
    });

    els.topicSelect.addEventListener("change", function () {
      if (session.mode === "topic") {
        nextQuestion();
      }
    });

    els.nextBtn.addEventListener("click", nextQuestion);
    els.resetBtn.addEventListener("click", resetProgress);
    els.exportBtn.addEventListener("click", exportProgress);
    els.importBtn.addEventListener("click", function () {
      els.importInput.click();
    });
    els.importInput.addEventListener("change", importProgress);
  }

  function updateModePanels() {
    els.topicSection.hidden = session.mode !== "topic";
    els.examSection.hidden = session.mode !== "exam";
    updateExamMeter();
  }

  function startExam() {
    session.examIds = createExamQuestionIds();
    session.examIndex = 0;
    nextQuestion();
  }

  function nextQuestion() {
    if (!questions.length) {
      renderEmpty("No hay preguntas cargadas.");
      return;
    }

    if (session.mode === "exam") {
      if (!session.examIds.length) {
        startExam();
        return;
      }
      if (session.examIndex >= session.examIds.length) {
        renderExamFinished();
        return;
      }
      session.current = getQuestionById(session.examIds[session.examIndex]) || questions[0];
      session.examIndex += 1;
    } else if (session.mode === "random") {
      session.current = pickBalancedRandomQuestion();
    } else {
      var pool = getQuestionPool();

      if (!pool.length && session.mode === "failed") {
        renderEmpty("Todavia no hay preguntas falladas.");
        return;
      }

      if (!pool.length && session.mode === "images") {
        renderEmpty("No hay imagenes reales con metadatos suficientes. Completa autor, fecha o movimiento en artworks_review.csv.");
        return;
      }

      if (!pool.length) {
        pool = questions.slice();
      }

      session.current = pickWeighted(pool);
    }

    session.answered = false;
    renderQuestion(session.current);
    updateExamMeter();
  }

  function getQuestionPool() {
    if (session.mode === "topic") {
      return questions.filter(function (q) {
        return q.topic === els.topicSelect.value;
      });
    }

    if (session.mode === "failed") {
      return questions.filter(function (q) {
        return getQuestionStat(q.id).wrong > 0;
      });
    }

    if (session.mode === "images") {
      return questions.filter(function (q) {
        return isVisualQuestion(q);
      });
    }

    if (session.mode === "exam") {
      return session.examIds.map(function (id) {
        return getQuestionById(id);
      }).filter(Boolean);
    }

    return questions.slice();
  }

  function pickWeighted(pool) {
    var total = pool.reduce(function (sum, question) {
      return sum + getQuestionStat(question.id).weight;
    }, 0);
    var cursor = Math.random() * total;

    for (var i = 0; i < pool.length; i += 1) {
      cursor -= getQuestionStat(pool[i].id).weight;
      if (cursor <= 0) {
        return pool[i];
      }
    }

    return pool[pool.length - 1];
  }

  function pickBalancedRandomQuestion() {
    var theory = getTheoryQuestions();
    var visual = getVisualQuestions();
    var preferred = Math.random() < 0.5 ? theory : visual;
    var fallback = preferred === theory ? visual : theory;

    if (preferred.length) {
      return pickWeighted(preferred);
    }
    if (fallback.length) {
      return pickWeighted(fallback);
    }
    return null;
  }

  function createExamQuestionIds() {
    var target = Math.min(EXAM_SIZE, questions.length);
    var theoryTarget = Math.min(35, target);
    var visualTarget = Math.min(35, target - theoryTarget);
    var selected = [];
    var selectedIds = {};

    addWeightedSelection(selected, selectedIds, getTheoryQuestions(), theoryTarget);
    addWeightedSelection(selected, selectedIds, getVisualQuestions(), visualTarget);

    if (selected.length < target) {
      addWeightedSelection(selected, selectedIds, questions, target - selected.length);
    }

    return shuffle(selected).map(function (question) {
      return question.id;
    });
  }

  function addWeightedSelection(selected, selectedIds, pool, count) {
    var available = pool.filter(function (question) {
      return !selectedIds[question.id];
    });

    while (available.length && selected.length < EXAM_SIZE && count > 0) {
      var picked = pickWeighted(available);
      selected.push(picked);
      selectedIds[picked.id] = true;
      available = available.filter(function (question) {
        return question.id !== picked.id;
      });
      count -= 1;
    }
  }

  function getTheoryQuestions() {
    return questions.filter(function (question) {
      return question.source === "manual";
    });
  }

  function getVisualQuestions() {
    return questions.filter(isVisualQuestion);
  }

  function isVisualQuestion(question) {
    return Boolean(question && question.isVisual && ["autor", "fecha", "movimiento"].indexOf(question.visualField) !== -1);
  }

  function getQuestionById(id) {
    return questions.find(function (question) {
      return question.id === id;
    });
  }

  function renderQuestion(question) {
    var shuffled = shuffle(question.answers.map(function (answer, index) {
      return {
        text: answer,
        originalIndex: index
      };
    }));

    els.questionTopic.textContent = question.topic;
    els.questionType.textContent = question.type;
    els.questionText.textContent = question.text;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.nextBtn.disabled = false;

    if (question.image) {
      els.questionImage.hidden = false;
      els.questionImage.onerror = function () {
        els.questionImage.hidden = true;
      };
      els.questionImage.src = resolveImagePath(question.image);
      els.questionImage.alt = question.artwork ? question.artwork.obra : "";
    } else {
      els.questionImage.hidden = true;
      els.questionImage.onerror = null;
      els.questionImage.removeAttribute("src");
      els.questionImage.alt = "";
    }

    els.answers.innerHTML = "";
    shuffled.forEach(function (option) {
      var button = document.createElement("button");
      button.className = "answer-button";
      button.type = "button";
      button.textContent = option.text;
      button.dataset.correct = String(option.originalIndex === question.correctIndex);
      button.addEventListener("click", function () {
        answerQuestion(button);
      });
      els.answers.appendChild(button);
    });
  }

  function answerQuestion(button) {
    if (session.answered || !session.current) {
      return;
    }

    session.answered = true;

    var isCorrect = button.dataset.correct === "true";
    var correctText = session.current.answers[session.current.correctIndex];
    updateQuestionProgress(session.current.id, isCorrect);

    Array.prototype.forEach.call(els.answers.children, function (child) {
      child.disabled = true;
      if (child.dataset.correct === "true") {
        child.classList.add("correct");
      }
    });

    if (isCorrect) {
      button.classList.add("correct");
      els.feedback.textContent = "Correcto.";
      els.feedback.className = "feedback good";
    } else {
      button.classList.add("wrong");
      els.feedback.textContent = "No era esa. Respuesta correcta: " + correctText + ".";
      els.feedback.className = "feedback bad";
    }

    saveProgress();
    updateStats();
  }

  function updateQuestionProgress(id, isCorrect) {
    var stat = getQuestionStat(id);

    if (isCorrect) {
      state.totalCorrect += 1;
      stat.correct += 1;
      stat.streak += 1;
      if (stat.streak >= 2) {
        stat.weight = Math.max(MIN_WEIGHT, stat.weight - 1);
      }
    } else {
      state.totalWrong += 1;
      stat.wrong += 1;
      stat.streak = 0;
      stat.weight = Math.min(MAX_WEIGHT, stat.weight + 3);
    }
  }

  function getQuestionStat(id) {
    if (!state.byQuestion[id]) {
      state.byQuestion[id] = {
        correct: 0,
        wrong: 0,
        streak: 0,
        weight: DEFAULT_WEIGHT
      };
    }
    return state.byQuestion[id];
  }

  function updateStats() {
    var total = state.totalCorrect + state.totalWrong;
    var accuracy = total ? Math.round((state.totalCorrect / total) * 100) : 0;
    var weakTopic = calculateWeakTopic();
    var mostMissed = questions.slice().sort(function (a, b) {
      return getQuestionStat(b.id).wrong - getQuestionStat(a.id).wrong;
    }).filter(function (q) {
      return getQuestionStat(q.id).wrong > 0;
    }).slice(0, 5);

    els.totalCorrect.textContent = state.totalCorrect;
    els.totalWrong.textContent = state.totalWrong;
    els.accuracy.textContent = accuracy + "%";
    els.weakTopic.textContent = weakTopic || "-";

    els.mostMissedList.innerHTML = "";
    if (!mostMissed.length) {
      var empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "Aun no hay fallos registrados.";
      els.mostMissedList.appendChild(empty);
    } else {
      mostMissed.forEach(function (question) {
        var stat = getQuestionStat(question.id);
        var item = document.createElement("li");
        var title = document.createElement("strong");
        var meta = document.createElement("span");

        title.textContent = question.text;
        meta.textContent = question.topic + " Â· " + stat.wrong + " fallos Â· peso " + stat.weight;
        item.appendChild(title);
        item.appendChild(meta);
        els.mostMissedList.appendChild(item);
      });
    }
  }

  function updateDiagnostics() {
    if (els.appVersion) {
      els.appVersion.textContent = "Version " + APP_VERSION;
    }
    if (els.realVisualCount) {
      els.realVisualCount.textContent = visualDiagnostics.realValid;
    }
    if (els.demoVisualExcluded) {
      els.demoVisualExcluded.textContent = visualDiagnostics.demoExcluded;
    }
    if (els.metadataVisualExcluded) {
      els.metadataVisualExcluded.textContent = visualDiagnostics.metadataExcluded;
    }
    if (els.extractedImageCount) {
      els.extractedImageCount.textContent = visualDiagnostics.extractedTotal;
    }
  }

  function calculateWeakTopic() {
    var topics = {};

    questions.forEach(function (question) {
      var stat = getQuestionStat(question.id);
      if (!topics[question.topic]) {
        topics[question.topic] = { correct: 0, wrong: 0 };
      }
      topics[question.topic].correct += stat.correct;
      topics[question.topic].wrong += stat.wrong;
    });

    return Object.keys(topics).sort(function (a, b) {
      var scoreA = topicWeaknessScore(topics[a]);
      var scoreB = topicWeaknessScore(topics[b]);
      return scoreB - scoreA;
    }).filter(function (topic) {
      return topics[topic].wrong > 0;
    })[0] || "";
  }

  function topicWeaknessScore(stat) {
    var total = stat.correct + stat.wrong;
    if (!total) {
      return 0;
    }
    return (stat.wrong / total) * 100 + stat.wrong;
  }

  function renderEmpty(message) {
    els.questionTopic.textContent = "Sin preguntas";
    els.questionType.textContent = "";
    els.questionText.textContent = message;
    els.questionImage.hidden = true;
    els.answers.innerHTML = "";
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
  }

  function renderExamFinished() {
    els.questionTopic.textContent = "Examen terminado";
    els.questionType.textContent = "30 preguntas";
    els.questionText.textContent = "Has terminado el examen. Puedes cambiar de modo o iniciar otro examen.";
    els.questionImage.hidden = true;
    els.answers.innerHTML = "";
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    updateExamMeter();
  }

  function updateExamMeter() {
    var total = session.examIds.length || Math.min(EXAM_SIZE, questions.length);
    var current = session.mode === "exam" ? Math.min(session.examIndex, total) : 0;
    var percent = total ? (current / total) * 100 : 0;
    els.examCounter.textContent = current + "/" + total;
    els.examProgress.style.width = percent + "%";
  }

  function resetProgress() {
    var confirmed = window.confirm("Â¿Seguro que quieres reiniciar todo el progreso?");
    if (!confirmed) {
      return;
    }

    state = createDefaultProgress();
    ensureQuestionStats();
    saveProgress();
    updateStats();
    nextQuestion();
  }

  function exportProgress() {
    var payload = {
      exportedAt: new Date().toISOString(),
      app: "Humanidades Quiz",
      version: 1,
      progress: state
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = "humanidades-quiz-progreso.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importProgress(event) {
    var file = event.target.files[0];
    if (!file) {
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || "{}"));
        var incoming = parsed.progress || parsed;
        state = sanitizeProgress(incoming);
        ensureQuestionStats();
        saveProgress();
        updateStats();
        nextQuestion();
        els.feedback.textContent = "Progreso importado.";
        els.feedback.className = "feedback good";
      } catch (error) {
        els.feedback.textContent = "No se pudo importar el archivo.";
        els.feedback.className = "feedback bad";
      } finally {
        els.importInput.value = "";
      }
    };
    reader.readAsText(file);
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? sanitizeProgress(JSON.parse(raw)) : createDefaultProgress();
    } catch (error) {
      return createDefaultProgress();
    }
  }

  function createDefaultProgress() {
    return {
      totalCorrect: 0,
      totalWrong: 0,
      byQuestion: {}
    };
  }

  function sanitizeProgress(progress) {
    var clean = createDefaultProgress();

    clean.totalCorrect = Math.max(0, Number(progress && progress.totalCorrect) || 0);
    clean.totalWrong = Math.max(0, Number(progress && progress.totalWrong) || 0);

    if (progress && progress.byQuestion) {
      Object.keys(progress.byQuestion).forEach(function (id) {
        var item = progress.byQuestion[id] || {};
        clean.byQuestion[id] = {
          correct: Math.max(0, Number(item.correct) || 0),
          wrong: Math.max(0, Number(item.wrong) || 0),
          streak: Math.max(0, Number(item.streak) || 0),
          weight: clamp(Number(item.weight) || DEFAULT_WEIGHT, MIN_WEIGHT, MAX_WEIGHT)
        };
      });
    }

    return clean;
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      els.feedback.textContent = "No se pudo guardar el progreso en este navegador.";
      els.feedback.className = "feedback bad";
    }
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function () {
        // La app funciona igualmente sin service worker.
      });
    }
  }

  function resolveImagePath(image) {
    if (/^(img\/|\.\/|\/|https?:|data:)/.test(image)) {
      return image;
    }
    return "img/" + image;
  }

  function uniqueArray(items) {
    return items.filter(function (item, index) {
      return item && items.indexOf(item) === index;
    });
  }

  function shuffle(items) {
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
