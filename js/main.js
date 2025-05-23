//画面遷移, ミノ操作以外の更新
$(document).ready(function () {
    // タイトル画面からゲーム画面
    $('#startButton').on('click', function () {
        playSound("select");
        setTimeout(() => {
            $('#titleScreen').hide();
            $('#gameOverScreen').hide();
            $('#gameScreen').show();
            startGame();
        }, 350);
    });

    // ゲームオーバー画面からリスタート(ゲーム画面)
    $('#restartButton').on('click', function () {
        playSound("select");
        $('#gameOverScreen').hide();
        $('#gameScreen').show();
        startGame();
    });

    // ゲームオーバー画面からタイトル画面
    $('#backButton').on('click', function () {
        playSound("select");
        $('#gameOverScreen').hide();
        $('#gameScreen').hide();
        $('#titleScreen').show();
    });

    // ゲーム画面からタイトル画面
    $('#startBackButton').on('click', function () {
        playSound("select");
        clearInterval(dropTimer);
        $('#gameOverScreen').hide();
        $('#gameScreen').hide();
        $('#titleScreen').show();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
});

//ゲームオーバー画面遷移
function showGameOver() {
    $('#scoreFinal').text('スコア: ' + score);
    $('#gameScreen').hide();
    $('#gameOverScreen').show();
}

//スコア更新
function updateScore(score) {
    $('#score').text('スコア: ' + score);
}
