let currentSong = new Audio();
let currFolder = "trending-song";
let songs = [];
let currentSongName;
let currentSongLi;
let songList = document.querySelector(".songList");
let songDuration = document.querySelector(".songTime");
let Circles = document.querySelector(".circle");
let seekBar = document.querySelector(".seekbar");
let burger = document.querySelector(".Burger");
let Close = document.querySelector(".close");
let Next = document.querySelector("#next");
let play = document.querySelector("#playbt");
let Previous = document.querySelector("#previous");
let Volumes = document.querySelector(".volume");
let rangeContainer = document.querySelector(".rangeContainer");
let volRange = document.querySelector(".rangeContainer input");
let playbar = document.querySelector(".playbar");
let songInfo = document.querySelector(".songInfo");

// Fetch all folders in the music directory
async function displayAlbum() {
  try {
    const response = await fetch("/music");
    const text = await response.text();
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(text, "text/html");
    const folderElements = htmlDoc.querySelectorAll('a[href*="/music/"]');
    const folders = Array.from(folderElements).map((element) => {
      const folderUrl = new URL(
        element.getAttribute("href"),
        "http://127.0.0.1:5500/"
      );
      return folderUrl.pathname.split("/").pop();
    });
    return folders;
  } catch (error) {
    console.error("Error fetching folders:", error);
    return [];
  }
}

// Create cards and show UI
async function createCard() {
  const folders = await displayAlbum();
  const cardContainer = document.querySelector(".cardContainer");

  folders.forEach((folder) => {
    const cardHTML = `
      <div data-folder="${folder}" class="card">
        <div class="play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
            <rect x="0" y="0" width="24" height="24" fill="#00FF00" rx="2" />
            <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z" stroke="currentColor" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
        </div>
        <img src="/music/${folder}/cover.jpeg" alt="">
        <h2>${folder}</h2>
        <p>Hits to boost your mood and fill you with happiness</p>
      </div>
    `;
    cardContainer.innerHTML += cardHTML;
  });

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      playSong(card.getAttribute("data-folder"));
    });
  });
}

// Fetch and play songs from the selected folder
async function playSong(folder) {
  currFolder = folder;
  songs = await fetchSongs(folder);
  updateSongList(songs);
}

// Fetch songs from the given folder
async function fetchSongs(folder) {
  try {
    const response = await fetch(`/music/${folder}/`);
    const text = await response.text();
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(text, "text/html");
    const songElements = htmlDoc.querySelectorAll("ul li a");

    return Array.from(songElements)
      .map((element) => {
        const url = new URL(
          element.getAttribute("href"),
          `http://127.0.0.1:5500/${folder}/`
        );
        if (url.pathname.endsWith(".mp3") || url.pathname.endsWith(".m4a")) {
          return decodeURIComponent(
            url.pathname.split(`/${folder}/`)[1]
          ).replace(/[+_]/g, " ");
        }
        return null;
      })
      .filter((song) => song);
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
}

// Update song list UI
function updateSongList(songs) {
  const songUl = songList.querySelector("ul");
  songUl.innerHTML = songs
    .map(
      (song) => `
    <li>
      <img class="invert" src="/images/music.svg" alt="">
      <div class="info">
        <div>${song}</div>
      </div>
      <div class="playNow">
        <span>Play Now</span>
        <img src="/images/play.svg" class="invert" alt="">
      </div>
    </li>
  `
    )
    .join("");

  Array.from(songList.getElementsByTagName("li")).forEach((e) => {
    e.addEventListener("click", () => {
      playMusic(e.querySelector(".info").firstElementChild.innerHTML);
      playbar.classList.add("barActive");
    });
  });
  songListItems = document.querySelectorAll(".songList li");
}

// Play the selected song
function playMusic(track) {
  currentSongName = track;
  const encodedTrack = encodeURIComponent(track);
  const songUrl = `http://127.0.0.1:5500/music/${currFolder}/${encodedTrack}`;

  currentSong.src = songUrl;
  currentSong.play();
  play.src = "/images/pause.svg";
  songInfo.innerText = track;
  songDuration.innerHTML = "00:00 / 00:00";

  songListItems.forEach((li) => li.classList.remove("currentlyPlaying"));
  currentSongLi = Array.from(songListItems).find((li) =>
    li.textContent.includes(track)
  );
  if (currentSongLi) currentSongLi.classList.add("currentlyPlaying");

  localStorage.setItem("currentSongName", track);
  localStorage.setItem("playbackState", "playing");
}

// Format time in MM:SS
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

// Event handlers
seekBar.addEventListener("click", (e) => {
  const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
  Circles.style.left = `${percent}%`;
  currentSong.currentTime = (currentSong.duration * percent) / 100;
});

let playEvent = function () {
  if (currentSong.paused) {
    currentSong.play();
    play.src = "/images/pause.svg";
    currentSongLi.classList.add("currentlyPlaying");
    localStorage.setItem("playbackState", "playing");
  } else {
    currentSong.pause();
    play.src = "/images/play.svg";
    currentSongLi.classList.remove("currentlyPlaying");
    localStorage.setItem("playbackState", "paused");
  }
};

Previous.addEventListener("click", () => {
  const currentIndex = songs.indexOf(currentSongName);
  playMusic(songs[(currentIndex - 1 + songs.length) % songs.length]);
});

Next.addEventListener("click", () => {
  const currentIndex = songs.indexOf(currentSongName);
  playMusic(songs[(currentIndex + 1) % songs.length]);
});

currentSong.addEventListener("timeupdate", () => {
  const currTime = currentSong.currentTime;
  const currDuration = currentSong.duration;

  songDuration.innerHTML = `${formatTime(currTime)} / ${formatTime(
    currDuration
  )}`;

  if (currTime && currDuration) {
    const progress = (currTime / currDuration) * 100;
    Circles.style.left = `${progress}%`;
  }

  if (currTime >= currDuration) {
    Circles.style.left = "0%";
    Next.click();
  }
});

burger.addEventListener("click", () => {
  document.querySelector(".left").style.left = "0";
});

Close.addEventListener("click", () => {
  document.querySelector(".left").style.left = "-120%";
});

Volumes.addEventListener("click", () => {
  rangeContainer.classList.toggle("active");
});

volRange.addEventListener("input", (e) => {
  currentSong.volume = e.target.value / 100;
});

function init() {
  currentSongName = localStorage.getItem("currentSongName");
  const playbackState = localStorage.getItem("playbackState");

  if (
    currentSongName &&
    currentSongName !== "undefined" &&
    currentSongName !== "null"
  ) {
    songInfo.innerText = currentSongName;
    if (playbackState === "playing") {
      currentSong.play();
      play.src = "/images/pause.svg";
    } else {
      currentSong.pause();
      play.src = "/images/play.svg";
    }
    play.addEventListener("click", playEvent);
  } else {
    play.addEventListener("click", () => playMusic(songs[0]));
  }

  rangeContainer.classList.remove("active");
}

// Initialize the player
window.addEventListener("load", () => {
  playbar.classList.remove("barActive");
  playSong(currFolder);
  createCard();
  init();
});
