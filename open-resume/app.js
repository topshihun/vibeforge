// ── Data Model ──
const defaultData = {
  name: '张三',
  photo: '',
  summary: '本人乐观开朗，在校成绩优异，自律能力强，具有良好的沟通能力和团队合作精神，可以使用英语进行工作交流。\n具有多年前端开发经验，熟悉React、Vue等前端框架，善于技术学习，持续关注互联网技术发展。\n求职意向：前端开发相关工作。',
  contacts: [
    { type: '邮箱', value: 'zhangsan@example.com', isLink: true },
    { type: '电话', value: '13800138000', isLink: false },
    { type: '个人网站', value: 'zhangsan.com', isLink: true },
    { type: 'GitHub', value: 'github.com/zhangsan', isLink: true }
  ],
  experience: [
    { company: 'ABC科技有限公司', position: '前端开发工程师', period: '2023.01 - 至今',
      description: '负责公司官网和管理系统的前端开发，使用React + TypeScript技术栈。\n参与需求分析、系统设计、开发和测试，确保项目按时交付。\n优化前端性能，提升用户体验。' }
  ],
  education: [
    { school: '某某大学', major: '计算机科学与技术', degree: '本科', period: '2019.09 - 2023.06',
      description: 'GPA: 3.8/4.0，专业排名前5%。\n获得国家奖学金、校级优秀学生等荣誉。' }
  ],
  skills: [
    { category: '前端技能', description: 'React, JavaScript, TypeScript, HTML, CSS, Ant Design, Vue' },
    { category: '后端技能', description: 'Node.js, Express, MongoDB' }
  ],
  projects: [
    { name: '企业管理系统', period: '2023.03 - 2023.06',
      description: '使用React + TypeScript + Ant Design开发的企业管理系统。\n负责前端页面开发和组件封装，实现了用户管理、权限控制、数据统计等功能。\n优化了系统性能，提升了用户体验。' }
  ]
};

let data = JSON.parse(JSON.stringify(defaultData));
let photoData = '';

// ── DOM refs ──
const $ = function(s) { return document.querySelector(s); };
const $$ = function(s) { return document.querySelectorAll(s); };

// ── Constants for A4 page ──
// A4: 210mm x 297mm, padding 15mm each side
// Content area: 180mm x 267mm, at 96dpi: ≈ 680px x 1009px
var PAGE_CONTENT_WIDTH = 680;
var PAGE_CONTENT_HEIGHT = 1000;  // slightly conservative

// ── Toast ──
function toast(msg, type) {
  type = type || 'success';
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 2000);
}

// ── Escape ──
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════════
//  Section HTML generators
// ════════════════════════════════════════════

function renderHeaderHtml(d) {
  var html = '<div class="preview-header">';
  if (d.photo) {
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    html += '<div style="flex:1;text-align:left"><h1>' + esc(d.name) + '</h1>';
    html += renderContactsHtml(d.contacts);
    html += '</div>';
    html += '<img src="' + d.photo + '" style="width:90px;height:115px;object-fit:cover;border-radius:4px;border:1px solid #e8e8e8;margin-left:20px">';
    html += '</div>';
  } else {
    html += '<h1>' + esc(d.name) + '</h1>';
    html += renderContactsHtml(d.contacts);
  }
  html += '</div>';
  return html;
}

function renderContactsHtml(contacts) {
  if (!contacts || !contacts.length) return '';
  var html = '<div class="contacts">';
  contacts.forEach(function(c) {
    if (!c.value) return;
    html += '<span><strong>' + esc(c.type||'') + '：</strong>';
    if (c.isLink) {
      var href = c.value;
      if (!/^https?:\/\//.test(href)) href = 'https://' + href;
      html += '<a href="' + esc(href) + '" target="_blank">' + esc(c.value) + '</a>';
    } else {
      html += esc(c.value);
    }
    html += '</span>';
  });
  html += '</div>';
  return html;
}

function renderSummaryHtml(d) {
  if (!d.summary) return null;
  return '<div class="preview-section"><h3>个人简介</h3>' +
    '<p style="white-space:pre-line;font-size:13px">' + esc(d.summary) + '</p></div>';
}

function renderExperienceHtml(d) {
  if (!d.experience || !d.experience.length) return null;
  var html = '<div class="preview-section"><h3>工作经历</h3>';
  d.experience.forEach(function(e) {
    html += '<div class="preview-item">';
    html += '<div class="item-head"><strong>' + esc(e.company||'') + '</strong><span class="period">' + esc(e.period||'') + '</span></div>';
    html += '<div class="item-sub">' + esc(e.position||'') + '</div>';
    html += '<div class="item-desc">' + esc(e.description||'') + '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderEducationHtml(d) {
  if (!d.education || !d.education.length) return null;
  var html = '<div class="preview-section"><h3>教育背景</h3>';
  d.education.forEach(function(e) {
    html += '<div class="preview-item">';
    html += '<div class="item-head"><strong>' + esc(e.school||'') + '</strong><span class="period">' + esc(e.period||'') + '</span></div>';
    html += '<div class="item-sub">' + esc(e.major||'') + (e.degree ? ' | ' + esc(e.degree) : '') + '</div>';
    html += '<div class="item-desc">' + esc(e.description||'') + '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderSkillsHtml(d) {
  if (!d.skills || !d.skills.length) return null;
  var html = '<div class="preview-section"><h3>技能</h3>';
  d.skills.forEach(function(s) {
    html += '<div style="margin-bottom:8px">';
    if (s.category) html += '<strong style="font-size:13px">' + esc(s.category) + '</strong><br>';
    if (s.description) {
      var tags = s.description.split(/[,，、]/);
      html += '<div class="skills-list">';
      tags.forEach(function(t) { if (t.trim()) html += '<span class="skill-tag">' + esc(t.trim()) + '</span>'; });
      html += '</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderProjectsHtml(d) {
  if (!d.projects || !d.projects.length) return null;
  var html = '<div class="preview-section"><h3>项目经历</h3>';
  d.projects.forEach(function(p) {
    html += '<div class="preview-item">';
    html += '<div class="item-head"><strong>' + esc(p.name||'') + '</strong><span class="period">' + esc(p.period||'') + '</span></div>';
    html += '<div class="item-desc">' + esc(p.description||'') + '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

// ════════════════════════════════════════════
//  Multi-page layout
// ════════════════════════════════════════════

/**
 * Build an ordered list of section descriptors:
 *   { name: string, html: string|null }
 * Only non-null sections are kept.
 */
function buildSections(d) {
  var sections = [];
  sections.push({ name: 'header',  html: renderHeaderHtml(d) });
  sections.push({ name: 'summary', html: renderSummaryHtml(d) });
  sections.push({ name: 'experience', html: renderExperienceHtml(d) });
  sections.push({ name: 'education', html: renderEducationHtml(d) });
  sections.push({ name: 'skills', html: renderSkillsHtml(d) });
  sections.push({ name: 'projects', html: renderProjectsHtml(d) });
  return sections.filter(function(s) { return s.html != null; });
}

/**
 * Measure the rendered height of a section's HTML.
 * Uses the hidden .measure-box element.
 */
function measureSectionHeight(html) {
  var box = $('#measure-box');
  box.innerHTML = html;
  // Force layout
  var h = box.offsetHeight;
  box.innerHTML = '';
  return h;
}

/**
 * Distribute sections across pages.
 * Returns an array of page descriptors: { sections: [{name,html}], pageNum }
 */
function paginate(sections) {
  var pages = [];
  var currentPageSections = [];
  var currentHeight = 0;

  for (var i = 0; i < sections.length; i++) {
    var sec = sections[i];
    var h = measureSectionHeight(sec.html);

    // If the section itself is taller than a page, it gets its own page
    if (h > PAGE_CONTENT_HEIGHT) {
      // Flush current page if not empty
      if (currentPageSections.length > 0) {
        pages.push({ sections: currentPageSections });
        currentPageSections = [];
        currentHeight = 0;
      }
      pages.push({ sections: [sec] });
      continue;
    }

    // If adding this section would overflow, start a new page
    if (currentHeight + h > PAGE_CONTENT_HEIGHT && currentPageSections.length > 0) {
      pages.push({ sections: currentPageSections });
      currentPageSections = [];
      currentHeight = 0;
    }

    currentPageSections.push(sec);
    currentHeight += h;
  }

  // Flush remaining
  if (currentPageSections.length > 0) {
    pages.push({ sections: currentPageSections });
  }

  // Ensure at least one page
  if (pages.length === 0) {
    pages.push({ sections: [] });
  }

  // Number pages
  for (var p = 0; p < pages.length; p++) {
    pages[p].pageNum = p + 1;
  }

  return pages;
}

/**
 * Render all pages into the preview panel.
 */
function renderPages(pages, totalPages) {
  var stack = $('#pages-stack');
  stack.innerHTML = '';

  pages.forEach(function(page) {
    var pageDiv = document.createElement('div');
    pageDiv.className = 'a4-page';

    var inner = '';
    page.sections.forEach(function(sec) {
      inner += sec.html;
    });

    // Page indicator
    inner += '<div class="page-indicator">第 ' + page.pageNum + ' / ' + totalPages + ' 页</div>';

    pageDiv.innerHTML = inner;
    stack.appendChild(pageDiv);
  });
}

/**
 * Full multi-page render pipeline.
 */
function renderMultiPage() {
  var d = data;
  d.photo = photoData;
  var sections = buildSections(d);
  var pages = paginate(sections);
  renderPages(pages, pages.length);
}

// ════════════════════════════════════════════
//  Collect form data
// ════════════════════════════════════════════

function collectData() {
  data.name = $('#f-name').value;
  data.summary = $('#f-summary').value;
  data.photo = photoData;

  // Contacts
  data.contacts = [];
  $$('#contacts-container .contact-card').forEach(function(card) {
    data.contacts.push({
      type: card.querySelector('.c-type').value,
      value: card.querySelector('.c-value').value,
      isLink: card.querySelector('.c-link').checked
    });
  });

  // Experience
  data.experience = [];
  $$('#experience-container .exp-card').forEach(function(card) {
    data.experience.push({
      company: card.querySelector('.e-company').value,
      position: card.querySelector('.e-position').value,
      period: card.querySelector('.e-period').value,
      description: card.querySelector('.e-desc').value
    });
  });

  // Education
  data.education = [];
  $$('#education-container .edu-card').forEach(function(card) {
    data.education.push({
      school: card.querySelector('.e-school').value,
      major: card.querySelector('.e-major').value,
      degree: card.querySelector('.e-degree').value,
      period: card.querySelector('.e-period').value,
      description: card.querySelector('.e-desc').value
    });
  });

  // Skills
  data.skills = [];
  $$('#skills-container .skill-card').forEach(function(card) {
    data.skills.push({
      category: card.querySelector('.s-category').value,
      description: card.querySelector('.s-desc').value
    });
  });

  // Projects
  data.projects = [];
  $$('#projects-container .proj-card').forEach(function(card) {
    data.projects.push({
      name: card.querySelector('.p-name').value,
      period: card.querySelector('.p-period').value,
      description: card.querySelector('.p-desc').value
    });
  });
}

// ── Sync & render ──
var syncTimer;
function syncAndRender() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(function() {
    collectData();
    renderMultiPage();
  }, 150);
}

// ════════════════════════════════════════════
//  Form population (editor ↔ data)
// ════════════════════════════════════════════

function populateForm() {
  $('#f-name').value = data.name || '';
  $('#f-summary').value = data.summary || '';
  photoData = data.photo || '';
  updatePhotoUI();

  // Contacts
  $('#contacts-container').innerHTML = '';
  (data.contacts || []).forEach(function(c) { addContactCard(c); });
  if (!(data.contacts||[]).length) addContactCard({type:'',value:'',isLink:false});

  // Experience
  $('#experience-container').innerHTML = '';
  (data.experience || []).forEach(function(e) { addExperienceCard(e); });

  // Education
  $('#education-container').innerHTML = '';
  (data.education || []).forEach(function(e) { addEducationCard(e); });

  // Skills
  $('#skills-container').innerHTML = '';
  (data.skills || []).forEach(function(s) { addSkillCard(s); });

  // Projects
  $('#projects-container').innerHTML = '';
  (data.projects || []).forEach(function(p) { addProjectCard(p); });

  renderMultiPage();
}

// ════════════════════════════════════════════
//  Editor card builders
// ════════════════════════════════════════════

function addContactCard(c) {
  c = c || {type:'',value:'',isLink:false};
  var div = document.createElement('div');
  div.className = 'contact-card card';
  div.innerHTML =
    '<div class="field-row">' +
    '<div class="form-group"><label>类型</label><input class="c-type" value="' + esc(c.type||'') + '" placeholder="如：邮箱、电话"></div>' +
    '<div class="form-group"><label>值</label><input class="c-value" value="' + esc(c.value||'') + '"></div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;margin-top:4px">' +
    '<label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox" class="c-link"' + (c.isLink?' checked':'') + '> 是否为链接</label>' +
    '<button class="btn btn-danger btn-sm contact-del" style="margin-left:auto">删除</button>' +
    '</div>';
  div.querySelector('.contact-del').onclick = function() { div.remove(); syncAndRender(); };
  div.querySelectorAll('input').forEach(function(inp) { inp.addEventListener('input', syncAndRender); });
  div.querySelector('.c-link').addEventListener('change', syncAndRender);
  $('#contacts-container').appendChild(div);
}

function addExperienceCard(e) {
  e = e || {company:'',position:'',period:'',description:''};
  var div = document.createElement('div');
  div.className = 'exp-card card';
  div.innerHTML =
    '<div class="card-header"><strong>工作经历</strong><button class="btn btn-danger btn-sm exp-del">删除</button></div>' +
    '<div class="field-row"><div class="form-group"><label>公司</label><input class="e-company" value="' + esc(e.company||'') + '"></div>' +
    '<div class="form-group"><label>职位</label><input class="e-position" value="' + esc(e.position||'') + '"></div></div>' +
    '<div class="form-group"><label>时间</label><input class="e-period" value="' + esc(e.period||'') + '" placeholder="如：2023.01 - 至今"></div>' +
    '<div class="form-group"><label>描述</label><textarea class="e-desc" rows="3">' + esc(e.description||'') + '</textarea></div>';
  div.querySelector('.exp-del').onclick = function() { div.remove(); syncAndRender(); };
  div.querySelectorAll('input,textarea').forEach(function(inp) { inp.addEventListener('input', syncAndRender); });
  $('#experience-container').appendChild(div);
}

function addEducationCard(e) {
  e = e || {school:'',major:'',degree:'',period:'',description:''};
  var div = document.createElement('div');
  div.className = 'edu-card card';
  div.innerHTML =
    '<div class="card-header"><strong>教育背景</strong><button class="btn btn-danger btn-sm edu-del">删除</button></div>' +
    '<div class="field-row"><div class="form-group"><label>学校</label><input class="e-school" value="' + esc(e.school||'') + '"></div>' +
    '<div class="form-group"><label>专业</label><input class="e-major" value="' + esc(e.major||'') + '"></div></div>' +
    '<div class="field-row"><div class="form-group"><label>学位</label><input class="e-degree" value="' + esc(e.degree||'') + '"></div>' +
    '<div class="form-group"><label>时间</label><input class="e-period" value="' + esc(e.period||'') + '"></div></div>' +
    '<div class="form-group"><label>描述</label><textarea class="e-desc" rows="3">' + esc(e.description||'') + '</textarea></div>';
  div.querySelector('.edu-del').onclick = function() { div.remove(); syncAndRender(); };
  div.querySelectorAll('input,textarea').forEach(function(inp) { inp.addEventListener('input', syncAndRender); });
  $('#education-container').appendChild(div);
}

function addSkillCard(s) {
  s = s || {category:'',description:''};
  var div = document.createElement('div');
  div.className = 'skill-card card';
  div.innerHTML =
    '<div class="field-row"><div class="form-group"><label>技能类别</label><input class="s-category" value="' + esc(s.category||'') + '" placeholder="如：前端技能"></div>' +
    '<button class="btn btn-danger btn-sm skill-del" style="margin-top:20px">删除</button></div>' +
    '<div class="form-group"><label>技能描述</label><input class="s-desc" value="' + esc(s.description||'') + '" placeholder="如：React, Vue, TypeScript"></div>';
  div.querySelector('.skill-del').onclick = function() { div.remove(); syncAndRender(); };
  div.querySelectorAll('input').forEach(function(inp) { inp.addEventListener('input', syncAndRender); });
  $('#skills-container').appendChild(div);
}

function addProjectCard(p) {
  p = p || {name:'',period:'',description:''};
  var div = document.createElement('div');
  div.className = 'proj-card card';
  div.innerHTML =
    '<div class="card-header"><strong>项目经历</strong><button class="btn btn-danger btn-sm proj-del">删除</button></div>' +
    '<div class="field-row"><div class="form-group"><label>项目名称</label><input class="p-name" value="' + esc(p.name||'') + '"></div>' +
    '<div class="form-group"><label>时间</label><input class="p-period" value="' + esc(p.period||'') + '"></div></div>' +
    '<div class="form-group"><label>描述</label><textarea class="p-desc" rows="3">' + esc(p.description||'') + '</textarea></div>';
  div.querySelector('.proj-del').onclick = function() { div.remove(); syncAndRender(); };
  div.querySelectorAll('input,textarea').forEach(function(inp) { inp.addEventListener('input', syncAndRender); });
  $('#projects-container').appendChild(div);
}

// ════════════════════════════════════════════
//  Photo Upload
// ════════════════════════════════════════════

function updatePhotoUI() {
  if (photoData) {
    $('#photo-empty').style.display = 'none';
    $('#photo-preview').style.display = 'flex';
    $('#photo-img').src = photoData;
    $('#photo-zone').classList.add('has-photo');
  } else {
    $('#photo-empty').style.display = '';
    $('#photo-preview').style.display = 'none';
    $('#photo-zone').classList.remove('has-photo');
  }
}

function handlePhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    photoData = e.target.result;
    updatePhotoUI();
    syncAndRender();
  };
  reader.readAsDataURL(file);
}

$('#photo-zone').onclick = function(e) {
  if (e.target === $('#photo-del')) return;
  $('#photo-input').click();
};
$('#photo-input').onchange = function() { handlePhotoFile(this.files[0]); };
$('#photo-del').onclick = function(e) {
  e.stopPropagation();
  photoData = '';
  updatePhotoUI();
  syncAndRender();
};

$('#photo-zone').addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drag'); });
$('#photo-zone').addEventListener('dragleave', function() { this.classList.remove('drag'); });
$('#photo-zone').addEventListener('drop', function(e) {
  e.preventDefault(); this.classList.remove('drag');
  handlePhotoFile(e.dataTransfer.files[0]);
});

// ════════════════════════════════════════════
//  Add buttons
// ════════════════════════════════════════════

$('#add-contact').onclick = function() { addContactCard(); syncAndRender(); };
$('#add-experience').onclick = function() { addExperienceCard(); syncAndRender(); };
$('#add-education').onclick = function() { addEducationCard(); syncAndRender(); };
$('#add-skill').onclick = function() { addSkillCard(); syncAndRender(); };
$('#add-project').onclick = function() { addProjectCard(); syncAndRender(); };

$('#f-name').addEventListener('input', syncAndRender);
$('#f-summary').addEventListener('input', syncAndRender);

// ════════════════════════════════════════════
//  FAB — export / import
// ════════════════════════════════════════════

var fabOpen = false;
$('#fab-toggle').onclick = function() {
  fabOpen = !fabOpen;
  $('#fab-menu').classList.toggle('show', fabOpen);
  this.classList.toggle('open', fabOpen);
};

// PDF export — uses browser print
$('#btn-pdf').onclick = function() {
  collectData();
  renderMultiPage();
  setTimeout(function() { window.print(); }, 200);
};

// JSON export
$('#btn-export-json').onclick = function() {
  collectData();
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'resume.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('JSON 导出成功');
};

// JSON import
$('#btn-import').onclick = function() { $('#import-input').click(); };
$('#import-input').onchange = function() {
  var file = this.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      data = JSON.parse(e.target.result);
      populateForm();
      toast('JSON 导入成功');
    } catch(err) {
      toast('JSON 格式错误', 'error');
    }
  };
  reader.readAsText(file);
  this.value = '';
};

// ════════════════════════════════════════════
//  Init
// ════════════════════════════════════════════

populateForm();
