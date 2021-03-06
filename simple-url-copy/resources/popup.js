const copyText = text => {
  let copyTextArea = document.querySelector("#copy-textarea");
  copyTextArea.textContent = text;
  copyTextArea.select();
  document.execCommand('copy');
}

const extractAmazonUrl = rawUrl => {
  const url = new URL(rawUrl);
  if (url.host == AMAZON_HOST) {
    if (url.pathname.match(/\/dp\/[A-Za-z0-9]/)) {
      newUrl = url.origin + url.pathname.replace(/(^\S+)(\/dp\/[A-Za-z0-9]{10})(.*)/, '$2');
      return newUrl;
    } else if (url.pathname.match(/\/gp\/product\/[A-Za-z0-9]/)) {
      newUrl = url.origin + url.pathname.replace(/(^\S+)?(\/gp\/product\/[A-Za-z0-9]{10})(.*)/, '$2');
      return newUrl;
    } else if (url.pathname.match(/\/gp\/aw\/d\/[A-Za-z0-9]/)) {
      newUrl = url.origin + url.pathname.replace(/(^\S+)?(\/gp\/aw\/d\/[A-Za-z0-9]{10})(.*)/, '$2');
      return newUrl;
    } else {
      return rawUrl;
    }
  } else {
    return rawUrl;
  }
}

const showCopied = _ => {
  let copied = document.querySelector("#copied");
  copied.classList.remove("fadeout");
  setTimeout(_ => copied.classList.add("fadeout"), 300);
}

const copyUrl = menuType => {
  chrome.tabs.query({
    active: true,
    currentWindow: true,
    lastFocusedWindow: true
  }, function(tabs) {
    // DevToolsのエラー対策
    if (tabs[0] == null) {
      document.querySelector("#DevToolsOpened").classList.remove("d-none");
      return;
    } else {
      document.querySelector("#DevToolsOpened").classList.add("d-none");
    }
    let url = tabs[0].url;
    const title = tabs[0].title;

    // Process AmazonURL
    url = extractAmazonUrl(url);

    const text = menuType
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\f/g, '\f')
      .replace(/\\t/g, '\t')
      .replace(/{title}/g, title)
      .replace(/{url}/g, url);
    copyText(text);
    showCopied();
  })
}

const onInit = _ => {
  chrome.storage.local.get(value => {
    const valueData = value['simpleUrlCopy'];
    const settingAry = getSettingAry(valueData);
    const menuType = settingAry[0][1];
    copyUrl(menuType);
  });
}

const onClickCopyMenu = elm => {
  const menuType = elm.dataset.text;
  copyUrl(menuType);
}

document.addEventListener("DOMContentLoaded", onInit);

const escapeHtml = str => {
  const rep = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return rep;
}
const getSettingAry = ary => {
  if (ary == null || ary.length === 0) return DEFAULT_SETTING;
  return ary;
}
const getButtonHtml = ary => {
  const buttonHtml = ary.map(val => {
    const label = escapeHtml(val[0]);
    const text = escapeHtml(val[1]);
    const checked = (val[2]) ? 'checked' : '';
    const html = BUTTON_HTML.replace(/{label}/g, label).replace(/{text}/g, text);
    if (checked) return html;
    return '';
  }).join('');
  return buttonHtml;
}
chrome.storage.local.get(value => {
  const valueData = value['simpleUrlCopy'];
  const settingAry = getSettingAry(valueData);
  const buttonHtml = getButtonHtml(settingAry);
  const menuElement = document.querySelector('#menu');
  menuElement.innerHTML = buttonHtml;
});
document.querySelector('#menu').addEventListener('click', e => {
  const target = e.target || e.srcElement;
  if (target.localName === 'button') onClickCopyMenu(target);
});
document.getElementById('setting').onclick = _ => {
  chrome.runtime.openOptionsPage()
};