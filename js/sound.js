//サウンド(SE)
const sounds = {
    select: new Audio('sound/maou_se_system37.mp3'),
    move: new Audio('sound/maou_se_system44.mp3'),
    put: new Audio('sound/maou_se_battle07.mp3'),
    drop: new Audio('sound/maou_se_system42.mp3'),
    rotate: new Audio('sound/maou_se_battle08.mp3'),
    hold: new Audio('sound/maou_se_magic_wind02.mp3'),
    clear: new Audio('sound/maou_se_system47.mp3')
};

//SE再生
function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play();
    }
}
