/* ============================================================
   SEBIN & SHEMA — BETROTHAL & WEDDING INVITATION
   Vanilla JS — cover opening, countdown, music, scroll reveal, RSVP
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Opening animation ---------- */
  var cover = document.getElementById("cover");
  var mainEl = document.getElementById("main");
  var tapBtn = document.getElementById("tapToOpen");
  document.documentElement.classList.add("locked");

  function openInvite() {
    if (!cover || cover.classList.contains("open")) return;
    cover.classList.add("open");
    mainEl.classList.add("show");
    document.documentElement.classList.remove("locked");
    startMusic();
    setTimeout(function () { cover.classList.add("hidden"); }, 1350);
  }

  if (tapBtn) {
    tapBtn.addEventListener("click", openInvite);
    tapBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openInvite(); }
    });
  }
  if (cover) cover.addEventListener("click", openInvite);

  /* ---------- Countdown — Betrothal: 21 November 2026, 11:00 AM IST ---------- */
  var targetDate = new Date("2026-11-21T11:00:00+05:30").getTime();
  var elDays = document.getElementById("cd-days");
  var elHours = document.getElementById("cd-hours");
  var elMins = document.getElementById("cd-mins");
  var elSecs = document.getElementById("cd-secs");

  function pad(n) { return String(n).padStart(2, "0"); }

  function animateNum(el, newVal) {
    if (!el || el.textContent === newVal) return;
    el.style.opacity = "0";
    setTimeout(function () {
      el.textContent = newVal;
      el.style.opacity = "1";
    }, 120);
  }

  function tickCountdown() {
    var diff = Math.max(0, targetDate - Date.now());
    animateNum(elDays,  pad(Math.floor(diff / 86400000)));
    animateNum(elHours, pad(Math.floor((diff % 86400000) / 3600000)));
    animateNum(elMins,  pad(Math.floor((diff % 3600000)  / 60000)));
    animateNum(elSecs,  pad(Math.floor((diff % 60000)    / 1000)));
  }
  if (elDays && elHours && elMins && elSecs) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ---------- Countdown — Wedding: 18 January 2027, 10:00 AM IST ---------- */
  var weddingDate = new Date("2027-01-18T10:00:00+05:30").getTime();
  var wdDays  = document.getElementById("wd-days");
  var wdHours = document.getElementById("wd-hours");
  var wdMins  = document.getElementById("wd-mins");
  var wdSecs  = document.getElementById("wd-secs");

  function tickWeddingCountdown() {
    var diff = Math.max(0, weddingDate - Date.now());
    animateNum(wdDays,  pad(Math.floor(diff / 86400000)));
    animateNum(wdHours, pad(Math.floor((diff % 86400000) / 3600000)));
    animateNum(wdMins,  pad(Math.floor((diff % 3600000)  / 60000)));
    animateNum(wdSecs,  pad(Math.floor((diff % 60000)    / 1000)));
  }
  if (wdDays && wdHours && wdMins && wdSecs) {
    tickWeddingCountdown();
    setInterval(tickWeddingCountdown, 1000);
  }

  /* ---------- Background music ---------- */
  var audio = document.getElementById("bg-music");
  var muteBtn = document.getElementById("mute-btn");
  var iconSound = document.getElementById("icon-sound");
  var iconMuted = document.getElementById("icon-muted");

  function setMuteIcon(playing) {
    if (iconSound) iconSound.style.display = playing ? "" : "none";
    if (iconMuted) iconMuted.style.display = playing ? "none" : "";
  }

  function startMusic() {
    if (!audio || !audio.paused) return;
    audio.volume = 0.40;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked — the next tap/scroll retries */ });
  }

  if (audio) {
    audio.addEventListener("play", function () { setMuteIcon(true); });
    audio.addEventListener("pause", function () { setMuteIcon(false); });
    window.addEventListener("load", startMusic);
    ["click", "scroll", "touchstart", "keydown"].forEach(function (evt) {
      document.addEventListener(evt, startMusic, { once: true, passive: true });
    });
  }

  if (muteBtn && audio) {
    muteBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (audio.paused) {
        audio.volume = 0.40;
        audio.play().catch(function () {});
      } else {
        audio.pause();
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -20px 0px" });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- RSVP — attendance toggle, counter, and Google Sheet submission ---------- */
  (function () {
    var form     = document.getElementById("rsvpForm");
    if (!form) return;

    var btnYes   = document.getElementById("btnYes");
    var btnNo    = document.getElementById("btnNo");
    var minusBtn = document.getElementById("rsvpMinus");
    var plusBtn  = document.getElementById("rsvpPlus");
    var countEl   = document.getElementById("rsvpCount");
    var nameEl    = document.getElementById("rsvpName");
    var msgEl     = document.getElementById("rsvpMessage");
    var submitBtn = document.getElementById("rsvpSubmit");

    // Paste the "Web app" URL you get after deploying the Apps Script
    // (see google-apps-script/Code.gs + SETUP_RSVP.md) here:
    var SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbxMOdNZ6-HWwlpfgxx3c0nko4kw8tjW9zoBB4fAKYtSr84rEaxp4XzYzOoZR9nsGnaDhA/exec";

    function submitToSheet(data) {
      if (!SHEET_ENDPOINT || SHEET_ENDPOINT.indexOf("PASTE_") === 0) {
        return Promise.resolve();
      }
      var body = new URLSearchParams(data);

      // Google Apps Script web apps don't send back CORS headers, so the
      // browser can never let us read the response (mode: 'cors' will
      // always fail here, even when the row is written successfully).
      // 'no-cors' is the standard, reliable way to POST to Apps Script:
      // it's fire-and-forget, but the request — and therefore doPost() —
      // still goes through.
      return fetch(SHEET_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: body.toString()
      }).catch(function (error) {
        // Only a genuine network failure (offline, blocked domain, etc.)
        // lands here — a successful write never reaches this branch.
        console.error("RSVP submission failed:", error);
      });
    }

    // ---- attendance toggle ----
    function setAttendance(attending) {
      if (btnYes) btnYes.classList.toggle("is-selected",  attending);
      if (btnNo)  btnNo.classList.toggle("is-selected",  !attending);
      if (btnYes) btnYes.querySelector("input").checked =  attending;
      if (btnNo)  btnNo.querySelector("input").checked  = !attending;
    }
    setAttendance(true); // default: yes

    if (btnYes) btnYes.addEventListener("click", function () { setAttendance(true);  });
    if (btnNo)  btnNo.addEventListener("click",  function () { setAttendance(false); });

    // ---- counter ----
    if (minusBtn) {
      minusBtn.addEventListener("click", function () {
        var v = parseInt(countEl.value, 10);
        if (v > 1) countEl.value = v - 1;
      });
    }
    if (plusBtn) {
      plusBtn.addEventListener("click", function () {
        var v = parseInt(countEl.value, 10);
        if (v < 10) countEl.value = v + 1;
      });
    }

    // ---- submit RSVP to Google Sheets ----
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // validate name
      var name = nameEl ? nameEl.value.trim() : "";
      if (!name) {
        if (nameEl) {
          nameEl.classList.add("is-error");
          nameEl.focus();
        }
        return;
      }
      if (nameEl) nameEl.classList.remove("is-error");

      var attending = btnYes ? btnYes.classList.contains("is-selected") : true;
      var count     = countEl ? (parseInt(countEl.value, 10) || 1) : 1;
      var message   = msgEl ? msgEl.value.trim() : "";

      var originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.remove("is-success");
        submitBtn.classList.add("is-submitting");
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="animation: rsvp-spin 0.9s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg> Submitting...';
      }

      // Save the RSVP to the Google Sheet (also emails the family)
      submitToSheet({
        name: name,
        attending: attending ? "Yes" : "No",
        guests: attending ? count : 0,
        message: message
      }).then(function () {
        form.reset();
        setAttendance(true);
        if (countEl) countEl.value = "1";
        if (nameEl) nameEl.value = "";
        if (msgEl) msgEl.value = "";

        if (submitBtn) {
          submitBtn.classList.remove("is-submitting");
          submitBtn.classList.add("is-success");
          submitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> RSVP Submitted Successfully!';

          window.setTimeout(function () {
            submitBtn.classList.remove("is-success");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }, 4500);
        }
      }).catch(function (error) {
        console.error("RSVP submission error:", error);
        if (submitBtn) {
          submitBtn.classList.remove("is-submitting");
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      });
    });

    // clear error state on input
    if (nameEl) {
      nameEl.addEventListener("input", function () {
        nameEl.classList.remove("is-error");
      });
    }
  }());


})();
