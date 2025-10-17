const dom = {
  root: document.documentElement,
  body: document.body,
  heroMedia: document.querySelector('.hero__media'),
  heroEyebrow: document.querySelector('[data-brand-eyebrow]'),
  heroTitle: document.querySelector('[data-brand-title]'),
  heroSubtitle: document.querySelector('[data-brand-subtitle]'),
  heroPrimaryCta: document.querySelector('[data-action="open-quote"]'),
  heroSecondaryCta: document.querySelector('[data-action="open-assistant"]'),
  brandLogo: document.getElementById('brand-logo'),
  brandName: document.querySelector('[data-brand-name]'),
  nav: document.querySelector('.primary-nav'),
  burger: document.querySelector('.site-header__burger'),
  header: document.querySelector('.site-header'),
  catalog: document.querySelector('[data-catalog]'),
  stats: document.querySelector('[data-stats]'),
  portfolio: document.querySelector('[data-portfolio]'),
  reviews: document.querySelector('[data-reviews]'),
  faq: document.querySelector('[data-faq]'),
  contacts: document.querySelector('[data-contacts]'),
  quoteModal: document.getElementById('quote-modal'),
  quoteForm: document.getElementById('quote-form'),
  quoteProduct: document.getElementById('quote-product'),
  quoteQty: document.getElementById('quote-qty'),
  toast: document.getElementById('flash'),
  assistant: document.getElementById('assistant-panel'),
  assistantForm: document.getElementById('assistant-form'),
  assistantPrompt: document.getElementById('assistant-prompt'),
  assistantOutput: document.querySelector('[data-assistant-output]'),
  portfolioModal: document.getElementById('portfolio-modal'),
  portfolioModalFigure: document.querySelector('[data-portfolio-modal]'),
  yearPlaceholders: document.querySelectorAll('[data-year]'),
  metaDescription: document.querySelector('meta[name="description"]'),
  ldOrg: document.getElementById('ld-org'),
  ldFaq: document.getElementById('ld-faq')
};

const state = {
  activeModal: null,
  lastFocused: null,
  assistantOpen: false,
  toastTimer: null,
  portfolioItems: []
};

async function loadJSON(path) {
  try {
    const response = await fetch(path, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Не удалось загрузить ${path}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('[content] пропускаем', path, error);
    return null;
  }
}

function applyPalette(palette) {
  if (!palette) return;
  Object.entries(palette).forEach(([token, value]) => {
    if (value) {
      dom.root.style.setProperty(`--c-${token.replace(/_/g, '-')}`, value);
    }
  });
}

function updateMeta(brand) {
  if (!brand) return;
  const titleParts = [brand.name];
  if (brand.tagline) {
    titleParts.push(brand.tagline);
  }
  document.title = titleParts.join(' — ');
  if (dom.metaDescription && brand.description) {
    dom.metaDescription.setAttribute('content', brand.description);
  }
  if (brand.favicon) {
    const link = document.querySelector('link[rel="icon"]');
    if (link) {
      link.setAttribute('href', brand.favicon);
    }
  }
}

async function setupHero(brand) {
  if (!brand) return;
  if (brand.hero) {
    const { eyebrow, title, subtitle, cta_primary, cta_secondary, background } = brand.hero;
    if (eyebrow && dom.heroEyebrow) dom.heroEyebrow.textContent = eyebrow;
    if (title && dom.heroTitle) dom.heroTitle.textContent = title;
    if (subtitle && dom.heroSubtitle) dom.heroSubtitle.textContent = subtitle;
    if (cta_primary && dom.heroPrimaryCta) dom.heroPrimaryCta.textContent = cta_primary;
    if (cta_secondary && dom.heroSecondaryCta) dom.heroSecondaryCta.textContent = cta_secondary;
    if (background && dom.heroMedia) {
      try {
        const response = await fetch(background, { method: 'HEAD' });
        if (response.ok) {
          dom.heroMedia.style.backgroundImage = `url('${background}')`;
        } else {
          dom.heroMedia.style.background = 'var(--c-accent-1)';
        }
      } catch (error) {
        console.warn('[hero] не удалось загрузить фон', error);
        dom.heroMedia.style.background = 'var(--c-accent-1)';
      }
    }
  }
  if (brand.name && dom.brandName) {
    dom.brandName.textContent = brand.name;
  }
  dom.yearPlaceholders.forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

function updateLogo(brand) {
  if (!brand || !dom.brandLogo || !dom.header) return;
  const theme = dom.header.dataset.theme || 'light';
  const logoSrc = theme === 'dark' ? brand.logo_light || brand.logo_dark : brand.logo_dark || brand.logo_light;
  dom.brandLogo.setAttribute('src', logoSrc || dom.brandLogo.getAttribute('src'));
  dom.brandLogo.setAttribute('alt', brand.name || 'Логотип');
  dom.brandLogo.setAttribute('loading', 'lazy');
}

function setupNavigation() {
  if (!dom.burger || !dom.nav) return;
  dom.burger.addEventListener('click', () => {
    const expanded = dom.burger.getAttribute('aria-expanded') === 'true';
    dom.burger.setAttribute('aria-expanded', String(!expanded));
    dom.nav.classList.toggle('is-open', !expanded);
    if (!expanded) {
      dom.nav.querySelector('a')?.focus();
    }
  });
  dom.nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      dom.burger.setAttribute('aria-expanded', 'false');
      dom.nav.classList.remove('is-open');
    });
  });
}

function showToast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add('is-visible');
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove('is-visible');
  }, 4000);
}

function openModal(modal, focusTarget) {
  if (!modal || state.activeModal === modal) return;
  state.lastFocused = document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  dom.body.classList.add('is-locked');
  state.activeModal = modal;
  const focusable = focusTarget || modal.querySelector('input, textarea, button, [href]');
  if (focusable) {
    window.requestAnimationFrame(() => focusable.focus());
  }
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (state.activeModal === modal) {
    state.activeModal = null;
    dom.body.classList.remove('is-locked');
    if (state.lastFocused) {
      state.lastFocused.focus?.();
      state.lastFocused = null;
    }
  }
}

function setupModalControls() {
  document.querySelectorAll('[data-close-modal]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      const modal = event.currentTarget.closest('.modal');
      closeModal(modal);
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (state.activeModal) {
        closeModal(state.activeModal);
      } else if (state.assistantOpen) {
        toggleAssistant(false);
      }
    }
  });
}

function openQuoteModal(presetProduct) {
  if (presetProduct && dom.quoteProduct) {
    dom.quoteProduct.value = presetProduct;
  }
  if (dom.quoteQty && !dom.quoteQty.value) {
    dom.quoteQty.value = 1;
  }
  openModal(dom.quoteModal, dom.quoteForm?.querySelector('input, textarea'));
}

function setupQuoteTriggers() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action="open-quote"]');
    if (!trigger) return;
    event.preventDefault();
    const preset = trigger.dataset.catalogTitle;
    openQuoteModal(preset);
  });
}

async function submitQuote(event) {
  event.preventDefault();
  if (!dom.quoteForm) return;
  const form = dom.quoteForm;
  if (!form.reportValidity()) {
    showToast('Проверьте обязательные поля.');
    return;
  }
  const honeypot = form.querySelector('input[name="website"]');
  if (honeypot && honeypot.value) {
    showToast('Не удалось отправить форму.');
    return;
  }
  if (dom.quoteQty && dom.quoteQty.value && Number(dom.quoteQty.value) < 1) {
    showToast('Минимальный тираж — 1.');
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  const initialText = submitButton?.textContent;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Отправляем...';
  }
  try {
    const payload = new FormData(form);
    const response = await fetch('/api/quote', {
      method: 'POST',
      body: payload
    });
    if (response.ok) {
      form.reset();
      showToast('Заявка отправлена. Свяжемся в ближайшее время.');
      closeModal(dom.quoteModal);
    } else if (response.status === 400) {
      const details = await safeJson(response);
      const message = details?.message || 'Проверьте корректность данных.';
      showToast(message);
    } else {
      showToast('Не удалось отправить заявку. Попробуйте позже.');
    }
  } catch (error) {
    console.error('[quote] ошибка отправки', error);
    showToast('Не удалось отправить заявку. Попробуйте позже.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = initialText;
    }
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function toggleAssistant(force) {
  if (!dom.assistant) return;
  const nextState = typeof force === 'boolean' ? force : !state.assistantOpen;
  state.assistantOpen = nextState;
  dom.assistant.classList.toggle('is-open', nextState);
  dom.assistant.setAttribute('aria-hidden', String(!nextState));
  dom.body.classList.toggle('is-locked', nextState || Boolean(state.activeModal));
  if (nextState) {
    window.requestAnimationFrame(() => dom.assistantPrompt?.focus());
  } else if (dom.assistantPrompt) {
    dom.assistantPrompt.value = '';
    dom.assistantOutput?.focus?.();
  }
}

function setupAssistantControls() {
  document.querySelectorAll('[data-action="open-assistant"]').forEach((button) => {
    button.addEventListener('click', () => toggleAssistant(true));
  });
  document.querySelectorAll('[data-assistant-close]').forEach((button) => {
    button.addEventListener('click', () => toggleAssistant(false));
  });
  dom.assistantForm?.addEventListener('submit', handleAssistantSubmit);
}

async function handleAssistantSubmit(event) {
  event.preventDefault();
  if (!dom.assistantPrompt || !dom.assistantOutput) return;
  const prompt = dom.assistantPrompt.value.trim();
  if (!prompt) {
    showToast('Опишите запрос для ассистента.');
    return;
  }
  const submitButton = dom.assistantForm.querySelector('button[type="submit"]');
  const initialText = submitButton?.textContent;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Генерируем...';
  }
  dom.assistantOutput.innerHTML = '';
  const loadingItem = document.createElement('li');
  loadingItem.className = 'assistant__item';
  loadingItem.textContent = 'Ассистент думает...';
  dom.assistantOutput.appendChild(loadingItem);
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    const data = await safeJson(response);
    if (response.ok && data) {
      renderAssistantIdeas(data);
    } else {
      throw new Error('assistant_error');
    }
  } catch (error) {
    console.error('[assistant] ошибка', error);
    dom.assistantOutput.innerHTML = '';
    const errorItem = document.createElement('li');
    errorItem.className = 'assistant__item';
    errorItem.textContent = 'Не удалось получить ответ. Попробуйте ещё раз позже.';
    dom.assistantOutput.appendChild(errorItem);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = initialText;
    }
  }
}

function renderAssistantIdeas(data) {
  if (!dom.assistantOutput) return;
  dom.assistantOutput.innerHTML = '';
  const ideas = extractAssistantIdeas(data);
  if (!ideas.length) {
    const placeholder = document.createElement('li');
    placeholder.className = 'assistant__item';
    placeholder.textContent = 'Ассистент не вернул идей, попробуйте переформулировать запрос.';
    dom.assistantOutput.appendChild(placeholder);
    return;
  }
  ideas.forEach((idea) => {
    const item = document.createElement('li');
    item.className = 'assistant__item';
    item.textContent = idea;
    dom.assistantOutput.appendChild(item);
  });
}

function extractAssistantIdeas(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.suggestions)) return payload.suggestions.map(String);
  if (Array.isArray(payload.ideas)) return payload.ideas.map(String);
  if (typeof payload.response === 'string') return [payload.response];
  if (typeof payload.message === 'string') return [payload.message];
  if (typeof payload.text === 'string') return [payload.text];
  if (Array.isArray(payload)) return payload.map(String);
  const values = Object.values(payload).filter((value) => typeof value === 'string');
  return values;
}

function renderCatalog(catalog) {
  if (!dom.catalog) return;
  dom.catalog.innerHTML = '';
  const directions = catalog?.directions || [];
  if (!directions.length) {
    dom.catalog.innerHTML = '<p class="section__empty">Каталог скоро появится.</p>';
    return;
  }
  directions.slice(0, 4).forEach((direction) => {
    const card = document.createElement('article');
    card.className = 'catalog-card';
    card.setAttribute('role', 'listitem');

    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'catalog-card__media';
    if (direction.items && direction.items[0]?.media) {
      const img = document.createElement('img');
      img.src = direction.items[0].media;
      img.alt = direction.items[0].name || direction.title;
      img.loading = 'lazy';
      img.width = 60;
      img.height = 60;
      mediaWrap.appendChild(img);
    } else {
      mediaWrap.setAttribute('aria-hidden', 'true');
    }
    card.appendChild(mediaWrap);

    const title = document.createElement('h3');
    title.className = 'catalog-card__title';
    title.textContent = direction.title;
    card.appendChild(title);

    if (direction.summary) {
      const summary = document.createElement('p');
      summary.className = 'catalog-card__summary';
      summary.textContent = direction.summary;
      card.appendChild(summary);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn--brand';
    button.textContent = 'В расчёт';
    button.dataset.action = 'open-quote';
    button.dataset.catalogTitle = direction.title;
    card.appendChild(button);

    dom.catalog.appendChild(card);
  });
}

function renderStats(stats) {
  if (!dom.stats) return;
  dom.stats.innerHTML = '';
  if (!stats) {
    dom.stats.innerHTML = '<p class="section__empty">Статистика временно недоступна.</p>';
    return;
  }
  const nf = new Intl.NumberFormat('ru-RU');
  const definitions = [
    {
      key: 'orders_12m',
      label: 'Заказов за 12 месяцев',
      format: (value) => nf.format(value)
    },
    {
      key: 'on_time_ratio',
      label: 'Своевременных запусков',
      format: (value) => `${Math.round(Number(value) * 100)}%`
    },
    {
      key: 'clients',
      label: 'Постоянных клиентов',
      format: (value) => nf.format(value)
    },
    {
      key: 'avg_lead_time_days',
      label: 'Средний lead time',
      format: (value) => `${nf.format(value)} дней`
    }
  ];

  let rendered = 0;
  definitions.forEach(({ key, label, format }) => {
    if (stats[key] === undefined || stats[key] === null) return;
    const card = document.createElement('article');
    card.className = 'stat-card';
    card.setAttribute('role', 'listitem');

    const dl = document.createElement('dl');
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = format(stats[key]);
    dl.append(dt, dd);
    card.appendChild(dl);
    dom.stats.appendChild(card);
    rendered += 1;
  });

  if (!rendered) {
    dom.stats.innerHTML = '<p class="section__empty">Цифры скоро обновятся.</p>';
  }
}

function renderPortfolio(portfolio) {
  if (!dom.portfolio) return;
  dom.portfolio.innerHTML = '';
  const cases = portfolio?.cases || [];
  if (!cases.length) {
    dom.portfolio.innerHTML = '<p class="section__empty">Портфолио готовится.</p>';
    return;
  }
  const displayed = cases.slice(0, 6);
  state.portfolioItems = displayed;
  displayed.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'portfolio-card';
    card.setAttribute('role', 'listitem');

    const img = document.createElement('img');
    img.src = item.thumb;
    img.alt = item.title;
    img.loading = 'lazy';
    img.width = 480;
    img.height = 320;
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'portfolio-card__body';

    const title = document.createElement('h3');
    title.className = 'portfolio-card__title';
    title.textContent = item.title;
    body.appendChild(title);

    if (Array.isArray(item.tags) && item.tags.length) {
      const tags = document.createElement('ul');
      tags.className = 'portfolio-card__tags';
      item.tags.forEach((tag) => {
        const tagItem = document.createElement('li');
        tagItem.className = 'portfolio-card__tag';
        tagItem.textContent = tag;
        tags.appendChild(tagItem);
      });
      body.appendChild(tags);
    }

    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.className = 'portfolio-card__action';
    viewButton.textContent = 'Смотреть кейс';
    viewButton.addEventListener('click', () => openPortfolioModal(index));
    body.appendChild(viewButton);

    card.appendChild(body);
    dom.portfolio.appendChild(card);
  });
}

function openPortfolioModal(index) {
  const item = state.portfolioItems[index];
  if (!item || !dom.portfolioModal || !dom.portfolioModalFigure) return;
  const img = dom.portfolioModalFigure.querySelector('img');
  const caption = dom.portfolioModalFigure.querySelector('figcaption');
  const source = item.images && item.images[0] ? item.images[0] : item.thumb;
  if (img) {
    img.src = source;
    img.alt = item.title;
  }
  if (caption) {
    caption.textContent = item.title;
  }
  openModal(dom.portfolioModal, dom.portfolioModal.querySelector('.modal__close'));
}

function renderReviews(reviews) {
  if (!dom.reviews) return;
  dom.reviews.innerHTML = '';
  const items = reviews?.reviews || [];
  if (!items.length) {
    dom.reviews.innerHTML = '<p class="section__empty">Отзывы появятся позже.</p>';
    return;
  }
  items.slice(0, 3).forEach((review) => {
    const card = document.createElement('article');
    card.className = 'review-card';
    card.setAttribute('role', 'listitem');

    const author = document.createElement('p');
    author.className = 'review-card__author';
    author.textContent = review.author;
    card.appendChild(author);

    const rating = document.createElement('div');
    rating.className = 'review-card__rating';
    const starsCount = Math.round(Number(review.rating) || 0);
    rating.textContent = '★'.repeat(starsCount).padEnd(5, '☆');
    card.appendChild(rating);

    if (review.text) {
      const text = document.createElement('p');
      text.className = 'review-card__text';
      text.textContent = review.text;
      card.appendChild(text);
    }

    if (review.source) {
      const source = document.createElement('p');
      source.className = 'review-card__source';
      source.textContent = `Источник: ${review.source}`;
      card.appendChild(source);
    }

    dom.reviews.appendChild(card);
  });
}

function renderFaq(faq) {
  if (!dom.faq) return;
  dom.faq.innerHTML = '';
  const items = faq?.items || [];
  if (!items.length) {
    dom.faq.innerHTML = '<p class="section__empty">Скоро добавим ответы.</p>';
    return;
  }
  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'faq__item';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `faq-answer-${index}`);
    button.setAttribute('role', 'listitem');

    const questionWrap = document.createElement('span');
    questionWrap.className = 'faq__question';
    questionWrap.textContent = item.q;

    const icon = document.createElement('span');
    icon.className = 'faq__icon';
    icon.setAttribute('aria-hidden', 'true');
    questionWrap.appendChild(icon);

    button.appendChild(questionWrap);

    const answer = document.createElement('p');
    answer.className = 'faq__answer';
    answer.id = `faq-answer-${index}`;
    answer.textContent = item.a;
    answer.hidden = true;

    button.appendChild(answer);
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      answer.hidden = expanded;
    });

    dom.faq.appendChild(button);
  });
}

function renderContacts(brand) {
  if (!dom.contacts) return;
  dom.contacts.innerHTML = '';
  const contacts = brand?.contacts;
  if (!contacts) {
    dom.contacts.innerHTML = '<li>Контакты уточняются.</li>';
    return;
  }
  let hasDetails = false;
  if (contacts.phone) {
    const phoneItem = document.createElement('li');
    const phoneLink = document.createElement('a');
    phoneLink.href = `tel:${contacts.phone.replace(/[^+\d]/g, '')}`;
    phoneLink.textContent = contacts.phone;
    phoneItem.textContent = 'Телефон: ';
    phoneItem.appendChild(phoneLink);
    dom.contacts.appendChild(phoneItem);
    hasDetails = true;
  }
  if (contacts.email) {
    const emailItem = document.createElement('li');
    const emailLink = document.createElement('a');
    emailLink.href = `mailto:${contacts.email}`;
    emailLink.textContent = contacts.email;
    emailItem.textContent = 'Email: ';
    emailItem.appendChild(emailLink);
    dom.contacts.appendChild(emailItem);
    hasDetails = true;
  }
  if (contacts.address) {
    const addressItem = document.createElement('li');
    addressItem.textContent = `Адрес: ${contacts.address}`;
    dom.contacts.appendChild(addressItem);
    hasDetails = true;
  }
  if (contacts.schedule) {
    const scheduleItem = document.createElement('li');
    scheduleItem.textContent = `График: ${contacts.schedule}`;
    dom.contacts.appendChild(scheduleItem);
    hasDetails = true;
  }
  if (!hasDetails) {
    dom.contacts.innerHTML = '<li>Контакты уточняются.</li>';
  }
}

function renderLdOrganization(brand) {
  if (!dom.ldOrg || !brand) return;
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: brand.url,
    logo: brand.logo_light || brand.logo_dark,
    description: brand.description
  };
  dom.ldOrg.textContent = JSON.stringify(org, null, 2);
}

function renderLdFaq(faq) {
  if (!dom.ldFaq || !faq?.items?.length) return;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a
      }
    }))
  };
  dom.ldFaq.textContent = JSON.stringify(schema, null, 2);
}

async function init() {
  setupNavigation();
  setupModalControls();
  setupQuoteTriggers();
  setupAssistantControls();
  dom.quoteForm?.addEventListener('submit', submitQuote);

  const [brand, catalog, stats, portfolio, reviews, faq] = await Promise.all([
    loadJSON('/content/brand.json'),
    loadJSON('/content/catalog.json'),
    loadJSON('/content/stats.json'),
    loadJSON('/content/portfolio.json'),
    loadJSON('/content/reviews.json'),
    loadJSON('/content/faq.json')
  ]);

  applyPalette(brand?.palette);
  updateMeta(brand);
  await setupHero(brand);
  updateLogo(brand);
  renderCatalog(catalog);
  renderStats(stats);
  renderPortfolio(portfolio);
  renderReviews(reviews);
  renderFaq(faq);
  renderContacts(brand);
  renderLdOrganization(brand);
  renderLdFaq(faq);
}

init();
