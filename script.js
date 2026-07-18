/* ═══════════════════════════════════════════════
   KIM KIHYUN — portfolio interactions
   ═══════════════════════════════════════════════ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ── 로드 연출 (폰트 준비 후 히어로 타이틀 등장) ── */
  var loadedOnce = false;
  function markLoaded() {
    if (loadedOnce) return;
    loadedOnce = true;
    document.body.classList.add("loaded");
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(markLoaded);
  }
  setTimeout(markLoaded, 900);

  /* ── 스크롤 리빌 ── */
  var revealEls = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = (batch * 70) + "ms";
        entry.target.classList.add("in");
        io.unobserve(entry.target);
        batch += 1;
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ── NAV 상태 + 스크롤 진행바 ── */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 32);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (h > 0 ? window.scrollY / h : 0) + ")";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ── 현재 섹션 내비 하이라이트 ── */
  var navLinks = document.querySelectorAll(".nav-links a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var sectionMap = {};
    navLinks.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) sectionMap[sec.id] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove("active"); });
        sectionMap[entry.target.id].classList.add("active");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(sectionMap).forEach(function (id) {
      spy.observe(document.getElementById(id));
    });
  }

  /* ── 모바일 메뉴 ── */
  var menuBtn = document.getElementById("menuBtn");
  var menuOverlay = document.getElementById("menuOverlay");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    menuBtn.textContent = open ? "CLOSE" : "MENU";
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuOverlay.setAttribute("aria-hidden", open ? "false" : "true");
  }
  menuBtn.addEventListener("click", function () {
    setMenu(!document.body.classList.contains("menu-open"));
  });
  menuOverlay.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });

  /* ── 카드 호버 프리뷰 재생 ── */
  var mediaCards = document.querySelectorAll(".card-media");
  function playPreview(card) {
    var v = card.querySelector("video");
    if (!v) return;
    card.classList.add("playing");
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  function stopPreview(card) {
    var v = card.querySelector("video");
    if (!v) return;
    card.classList.remove("playing");
    v.pause();
  }
  if (finePointer && !prefersReduced) {
    mediaCards.forEach(function (card) {
      card.addEventListener("mouseenter", function () { playPreview(card); });
      card.addEventListener("mouseleave", function () { stopPreview(card); });
    });
  } else if (!prefersReduced) {
    /* 터치 기기: 화면에 60% 이상 보이면 자동 재생 */
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) playPreview(entry.target);
        else stopPreview(entry.target);
      });
    }, { threshold: 0.6 });
    mediaCards.forEach(function (card) { vio.observe(card); });
  }

  /* ── 라이트박스 ── */
  var lightbox = document.getElementById("lightbox");
  var lbStage = document.getElementById("lbStage");
  var lbCaption = document.getElementById("lbCaption");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var lastFocus = null;
  var gallery = null; /* {items:[{src,alt,caption}], index} — 이미지 그룹 탐색용 */

  function isYouTube(url) {
    return /(?:youtube\.com|youtu\.be)\//.test(url);
  }
  /* 유튜브는 임베드 대신 링크 패널 (로컬/임베드 제한 환경에서도 항상 동작) */
  function ytPanel(url, title) {
    return '<div class="lb-msg lb-yt"><strong>' + title + "</strong>" +
      '<p class="lb-url">' + url + "</p>" +
      '<div class="lb-actions">' +
      '<a class="lb-act" href="' + url + '" target="_blank" rel="noopener">유튜브에서 열기&nbsp;↗</a>' +
      '<button class="lb-act" type="button" data-copy-url="' + url + '">링크 복사</button>' +
      "</div></div>";
  }
  function videoEmbed(url) {
    var vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) {
      return '<iframe src="https://player.vimeo.com/video/' + vm[1] +
        '?autoplay=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="video player"></iframe>';
    }
    return null;
  }
  function playSource(src, title) {
    if (isYouTube(src)) {
      openLightbox(ytPanel(src, title), title);
      return;
    }
    var embed = videoEmbed(src);
    openLightbox(
      embed || '<video src="' + src + '" controls autoplay playsinline></video>',
      title
    );
  }

  function openLightbox(html, caption) {
    /* 뒤에서 돌고 있는 카드 프리뷰 정지 */
    document.querySelectorAll(".card-media.playing video").forEach(function (v) {
      v.pause();
      v.closest(".card-media").classList.remove("playing");
    });
    lbStage.innerHTML = html;
    lbCaption.textContent = caption || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lb-lock");
    lastFocus = document.activeElement;
    lbClose.focus();
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.classList.remove("has-nav");
    gallery = null;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lb-lock");
    lbStage.innerHTML = "";
    if (lastFocus) lastFocus.focus();
  }
  lbClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox || e.target === lbStage) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    var lbOpen = lightbox.classList.contains("open");
    if (e.key === "Escape") {
      if (lbOpen) closeLightbox();
      if (document.body.classList.contains("menu-open")) setMenu(false);
      return;
    }
    if (lbOpen && gallery) {
      if (e.key === "ArrowLeft") showGalleryItem(gallery.index - 1);
      if (e.key === "ArrowRight") showGalleryItem(gallery.index + 1);
    }
    /* 라이트박스 안에서 Tab 순환 (포커스 트랩) */
    if (lbOpen && e.key === "Tab") {
      var focusables = Array.prototype.filter.call(
        lightbox.querySelectorAll("button, a, video, iframe"),
        function (el) { return el.offsetParent !== null; }
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* 필름 카드 → 라이트박스 */
  document.querySelectorAll(".film").forEach(function (film) {
    var btn = film.querySelector(".card-media");
    btn.addEventListener("click", function () {
      var src = (film.getAttribute("data-video") || "").trim();
      var title = film.getAttribute("data-title") || "";
      var credit = film.getAttribute("data-credit");
      if (credit) title += "  ·  " + credit;
      if (!src) {
        openLightbox(
          '<div class="lb-msg"><strong>' + title + "</strong>" +
          "<p>이 작품은 아직 온라인 링크가 연결되지 않았습니다.<br>" +
          "유튜브/비메오에 업로드한 뒤 <code>index.html</code>의 해당 카드<br>" +
          "<code>data-video</code> 속성에 링크를 넣으면 이곳에서 재생됩니다.</p></div>",
          title
        );
        return;
      }
      playSource(src, title);
    });
  });

  /* 유튜브 링크 복사 버튼 (라이트박스 안) */
  lbStage.addEventListener("click", function (e) {
    var copyBtn = e.target.closest("[data-copy-url]");
    if (!copyBtn) return;
    var url = copyBtn.getAttribute("data-copy-url");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast("링크가 복사되었습니다");
      }, function () {
        showToast(url);
      });
    } else {
      showToast(url);
    }
  });

  /* 스틸·다큐 스틸 → 라이트박스 (그룹 내 ← → 탐색) */
  function showGalleryItem(i) {
    if (!gallery) return;
    var n = gallery.items.length;
    gallery.index = (i + n) % n;
    var item = gallery.items[gallery.index];
    lbStage.innerHTML = '<img src="' + item.src + '" alt="' + item.alt + '">';
    lbCaption.textContent = item.caption + "  —  " + (gallery.index + 1) + "/" + n;
  }
  function bindGallery(selector) {
    var list = Array.prototype.slice.call(document.querySelectorAll(selector));
    list.forEach(function (el, idx) {
      el.addEventListener("click", function () {
        var items = list.map(function (b) {
          var img = b.querySelector("img");
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") || "",
            caption: b.getAttribute("data-caption") || ""
          };
        });
        gallery = { items: items, index: idx };
        openLightbox("", "");
        lightbox.classList.add("has-nav");
        showGalleryItem(idx);
      });
    });
  }
  bindGallery(".still");
  bindGallery(".dstill");
  lbPrev.addEventListener("click", function () {
    if (gallery) showGalleryItem(gallery.index - 1);
  });
  lbNext.addEventListener("click", function () {
    if (gallery) showGalleryItem(gallery.index + 1);
  });

  /* 인덱스 행 → 라이트박스 재생 + 호버 썸네일 */
  var idxThumb = document.getElementById("idxThumb");
  var idxImg = idxThumb ? idxThumb.querySelector("img") : null;
  document.querySelectorAll(".idx-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var src = (btn.getAttribute("data-video") || "").trim();
      var title = btn.getAttribute("data-title") || "";
      var credit = btn.getAttribute("data-credit");
      if (credit) title += "  ·  " + credit;
      if (!src) return;
      playSource(src, title);
    });
    if (finePointer && !prefersReduced && idxImg) {
      btn.addEventListener("mouseenter", function () {
        var t = btn.getAttribute("data-thumb");
        if (!t) return;
        idxImg.src = t;
        idxThumb.classList.add("on");
      });
      btn.addEventListener("mouseleave", function () {
        idxThumb.classList.remove("on");
      });
    }
  });
  if (finePointer && !prefersReduced && idxThumb) {
    document.addEventListener("mousemove", function (e) {
      if (!idxThumb.classList.contains("on")) return;
      var x = Math.min(e.clientX + 28, window.innerWidth - 420);
      idxThumb.style.transform =
        "translate(" + x + "px," + (e.clientY - 24) + "px) translate(0,-100%)";
    });
  }

  /* ── 커서 ── */
  if (finePointer && !prefersReduced) {
    var cursor = document.getElementById("cursor");
    var cursorLabel = document.getElementById("cursorLabel");
    var cx = -100, cy = -100, tx = -100, ty = -100;
    var cursorSeen = false;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!cursorSeen) {
        cursorSeen = true;
        cx = tx; cy = ty;
        cursor.style.opacity = "1";
      }
    });
    (function loop() {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      var target = e.target.closest("[data-cursor]");
      if (target) {
        cursorLabel.textContent = target.getAttribute("data-cursor");
        cursor.classList.add("on");
      } else {
        cursor.classList.remove("on");
      }
    });
  }

  /* ── 이메일 복사 ── */
  var mailBtn = document.getElementById("mailBtn");
  var toast = document.getElementById("toast");
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2000);
  }
  if (mailBtn) {
    mailBtn.addEventListener("click", function () {
      var mail = mailBtn.getAttribute("data-mail");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail).then(function () {
          showToast("이메일이 복사되었습니다 — " + mail.toUpperCase());
        }, function () {
          window.location.href = "mailto:" + mail;
        });
      } else {
        window.location.href = "mailto:" + mail;
      }
    });
  }

  /* ── 연도 ── */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
