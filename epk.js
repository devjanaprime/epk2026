document.addEventListener('DOMContentLoaded', () => {
  // Replace with your actual raw GitHub URL
  fetch(GITHUB_RAW_URL)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load data from GitHub: ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      // Unlike JSONbin, raw GitHub JSON returns your actual data directly 
      // without wrapping it in a ".record" property.
      console.log( 'loaded JSON from github:', GITHUB_RAW_URL )
      initEPK(data);
    })
    .catch(err => console.error('EPK initialization error:', err));
});

function initEPK(data) {
  // Footer Year
  document.getElementById('year').textContent = new Date().getFullYear();

  // 1. SEO & Metadata
  if (data.seo) {
    if (data.seo.title) {
      document.title = data.seo.title;
      setMetaText('seo-title', data.seo.title);
      setMetaContent('og-title', data.seo.title);
    }
    if (data.seo.description) {
      setMetaContent('seo-desc', data.seo.description);
      setMetaContent('og-desc', data.seo.description);
    }
    if (data.seo.ogImage) {
      setMetaContent('og-image', data.seo.ogImage);
    }
  }

  // 2. Header & Branding
  // hero banner
  if (data.assets && data.assets.heroBannerImage) {
    const heroBg = document.getElementById('hero-bg');
    if (heroBg) {
      heroBg.style.backgroundImage = `url('${data.assets.heroBannerImage}')`;
      heroBg.style.backgroundSize = 'cover';
      heroBg.style.backgroundPosition = 'center';
    }
  }

  if (data.artistName) {
    document.getElementById('artist-name').textContent = data.artistName;
    document.getElementById('footer-artist').textContent = data.artistName;
  }
  
  if (data.tagline) {
    document.getElementById('artist-tagline').textContent = data.tagline;
  }

  if (data.assets && data.assets.artistLogoImage) {
    document.getElementById('artist-logo-container').innerHTML = 
      `<img src="${data.assets.artistLogoImage}" alt="${data.artistName} Logo">`;
  }

  if (data.genreTags && data.genreTags.length > 0) {
    document.getElementById('genre-tags').innerHTML = 
      data.genreTags.map(tag => `<span class="pill">${tag}</span>`).join('');
  }

  if (data.pressKitDownloadUrl) {
    const zipBtn = document.getElementById('epk-zip-btn');
    zipBtn.href = data.pressKitDownloadUrl;
    zipBtn.style.display = 'inline-block';
  }

  // 3. Hero Video Section
 // 3. Hero Video Section
  renderSection('hero-video-section', data.heroVideo && (data.heroVideo.videoId || data.heroVideo.embedUrl), () => {
    let embedHtml = '';
    const videoWrapper = document.getElementById('video-wrapper');
    const ratio = data.heroVideo.aspectRatio || '16x9';

    // Apply the dynamic aspect ratio class

    if (data.heroVideo.type === 'youtube') {
    videoWrapper.className = `responsive-video-container ratio-${ratio}`;
      embedHtml = `<iframe src="https://www.youtube.com/embed/${data.heroVideo.videoId}" allowfullscreen></iframe>`;
    } else if (data.heroVideo.type === 'facebook') {
    videoWrapper.className = `responsive-video-container ratio-${ratio}`;
      const fbUrl = encodeURIComponent(data.heroVideo.embedUrl || `https://www.facebook.com/watch/?v=${data.heroVideo.videoId}`);
      embedHtml = `<iframe src="https://www.facebook.com/plugins/video.php?href=${fbUrl}&show_text=false" allowfullscreen></iframe>`;
    }else if (data.heroVideo.type === 'direct') {
    videoWrapper.className = `responsive-video-container`;
      embedHtml = `<div class="video-container">
        <video controls width="100%" playsinline>
          <source src="${ data.heroVideo.videoId }" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>`;
    }

    videoWrapper.innerHTML = embedHtml;
    document.getElementById('video-caption').textContent = data.heroVideo.caption || '';
  });

  // 4. Bio Section
  const hasBio = data.shortBio || (data.fullBio && data.fullBio.length > 0) || (data.notableHighlights && data.notableHighlights.length > 0);
  renderSection('bio-section', hasBio, () => {
    if (data.shortBio) {
      document.getElementById('short-bio').textContent = data.shortBio;
    }
    if (data.fullBio && data.fullBio.length > 0) {
      document.getElementById('full-bio-paragraphs').innerHTML = 
        data.fullBio.map(p => `<p>${p}</p>`).join('');
    }
    if (data.notableHighlights && data.notableHighlights.length > 0) {
      document.getElementById('highlights-container').style.display = 'block';
      document.getElementById('highlights-list').innerHTML = 
        data.notableHighlights.map(h => `<li>${h}</li>`).join('');
    }
  });

  // 5. Audio Section (Spotify + Hosted Tracks)
  const hasAudio = data.spotifyEmbedUrl || (data.tracks && data.tracks.length > 0);
  renderSection('audio-section', hasAudio, () => {
    if (data.spotifyEmbedUrl) {
      document.getElementById('spotify-container').innerHTML = `
        <iframe style="border-radius:12px; border:0;" src="${data.spotifyEmbedUrl}" width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
      `;
    }
    if (data.tracks && data.tracks.length > 0) {
      const tracksHtml = data.tracks.map(t => `
        <div class="track-card">
          <div class="track-header">
            <span class="track-title">${t.title}</span>
            <audio controls src="${t.src}" preload="none"></audio>
          </div>
          ${t.description ? `<p class="track-description">${t.description}</p>` : ''}
        </div>
      `).join('');
      
      document.getElementById('hosted-tracks-container').innerHTML = `
        ${tracksHtml}
      `;
    }
  });

  // 6. Press Quotes Section
  renderSection('quotes-section', data.pressQuotes && data.pressQuotes.length > 0, () => {
    document.getElementById('quotes-grid').innerHTML = data.pressQuotes.map(q => `
      <div class="quote-card">
        <p class="quote-text">"${q.quote}"</p>
        <p class="quote-author">&mdash; ${q.author}${q.source ? `, <span>${q.source}</span>` : ''}</p>
      </div>
    `).join('');
  });

  // 7. Press Photos Gallery
  renderSection('photos-section', data.pressPhotos && data.pressPhotos.length > 0, () => {
    document.getElementById('photos-grid').innerHTML = data.pressPhotos.map(p => `
      <a href="${p.hiResUrl || p.src}" target="_blank" class="photo-card" download>
        <img src="${p.src}" alt="${p.caption || 'Press Photo'}">
        ${p.caption ? `<div class="photo-caption">${p.caption} &darr;</div>` : ''}
      </a>
    `).join('');
  });

  // 8. Tech Rider & Stage Plot Section
  const hasTech = (data.assets && (data.assets.stagePlotImage || data.assets.techRiderDocument)) || data.stagePlotNotes;
  renderSection('tech-section', hasTech, () => {
    if (data.assets && data.assets.stagePlotImage) {
      document.getElementById('stage-plot-container').innerHTML = 
        `<img src="${data.assets.stagePlotImage}" alt="Stage Plot and Channel Diagram">`;
    }
    if (data.stagePlotNotes) {
      document.getElementById('stage-plot-notes').textContent = data.stagePlotNotes;
    }
    if (data.assets && data.assets.techRiderDocument) {
      document.getElementById('tech-rider-download').innerHTML = 
        `<a href="${data.assets.techRiderDocument}" class="btn btn-secondary" download>Download Full Tech Rider (.PDF)</a>`;
    }
  });

  // 9. Contact Section
  const hasContact = data.contactInfo && (data.contactInfo.bookingEmail || data.contactInfo.phone || data.contactInfo.socials);
  renderSection('contact-section', hasContact, () => {
    let detailsHtml = '';
    if (data.contactInfo.management) detailsHtml += `<p><strong>Management/Booking:</strong> ${data.contactInfo.management}</p>`;
    if (data.contactInfo.bookingEmail) detailsHtml += `<p><strong>Email:</strong> <a href="mailto:${data.contactInfo.bookingEmail}">${data.contactInfo.bookingEmail}</a></p>`;
    if (data.contactInfo.phone) detailsHtml += `<p><strong>Phone:</strong> ${data.contactInfo.phone}</p>`;
    if (data.location) detailsHtml += `<p><strong>Location:</strong> ${data.location}</p>`;
    
    document.getElementById('contact-details').innerHTML = detailsHtml;

    if (data.contactInfo.socials) {
      const soc = data.contactInfo.socials;
      const socLinks = Object.keys(soc)
        .filter(key => soc[key])
        .map(key => `<a href="${soc[key]}" target="_blank" rel="noopener">${capitalize(key)}</a>`)
        .join(' &bull; ');
      document.getElementById('socials-container').innerHTML = socLinks;
    }
  });
}

// Utility Helpers
function renderSection(id, condition, renderCallback) {
  const el = document.getElementById(id);
  if (!el) return;
  if (condition) {
    el.style.display = 'block';
    renderCallback();
  } else {
    el.style.display = 'none';
    el.innerHTML = '';
  }
}

function setMetaContent(id, val) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('content', val);
}

function setMetaText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}