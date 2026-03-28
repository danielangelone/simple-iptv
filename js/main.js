let channels = [];
let currentChannel = 0;
let listVisible = false;
let infoVisible = false;
let player;
let infoTimeout;
window.onload = function() {
    player = document.getElementById('player');
    document.getElementById('loading').style.display = 'none';
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('m3uUrl').focus();
};
function parseM3U(content) {
    const lines = content.split('\n');
    const result = [];
    let currentChannel = {};
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            const nameMatch = line.match(/,(.+)$/);
            currentChannel.name = nameMatch ? nameMatch[1] : 'Canal';
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            if (logoMatch) currentChannel.logo = logoMatch[1];
        } else if (line && !line.startsWith('#') && (line.startsWith('http') || line.startsWith('rtmp'))) {
            currentChannel.url = line;
            result.push({...currentChannel});
            currentChannel = {};
        }
    }
    return result;
}
async function loadPlaylist() {
    const url = document.getElementById('m3uUrl').value.trim();
    const errorDiv = document.getElementById('errorMsg');
    if (!url) {
        errorDiv.textContent = 'Por favor, insira uma URL válida';
        return;
    }
    errorDiv.textContent = 'Carregando...';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar: ' + response.status);
        const content = await response.text();
        channels = parseM3U(content);
        if (channels.length === 0) {
            errorDiv.textContent = 'Nenhum canal encontrado na playlist';
            return;
        }
        document.getElementById('urlInput').style.display = 'none';
        errorDiv.textContent = '';
        renderChannelList();
        playChannel(0);
        toggleChannelList();
    } catch (error) {
        errorDiv.textContent = 'Erro: ' + error.message;
        console.error(error);
    }
}
function renderChannelList() {
    const list = document.getElementById('channelList');
    list.innerHTML = '';
    channels.forEach((channel, index) => {
        const div = document.createElement('div');
        div.className = 'channel-item';
        div.textContent = (index + 1) + '. ' + channel.name;
        div.onclick = () => {
            playChannel(index);
            toggleChannelList();
        };
        div.dataset.index = index;
        list.appendChild(div);
    });
}
function playChannel(index) {
    if (index < 0 || index >= channels.length) return;
    currentChannel = index;
    const channel = channels[index];
    document.getElementById('channelName').textContent = channel.name;
    document.getElementById('channelUrl').textContent = channel.url.substring(0, 50) + '...';
    showInfo();
    player.src = channel.url;
    player.load();
    const playPromise = player.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error('Erro ao tocar:', error);
        });
    }
    updateListFocus();
}
function toggleChannelList() {
    listVisible = !listVisible;
    const list = document.getElementById('channelList');
    list.style.display = listVisible ? 'block' : 'none';
    if (listVisible) {
        updateListFocus();
        const items = list.querySelectorAll('.channel-item');
        if (items[currentChannel]) {
            items[currentChannel].scrollIntoView({ block: 'center' });
        }
    }
}
function updateListFocus() {
    const items = document.querySelectorAll('.channel-item');
    items.forEach((item, idx) => {
        if (idx === currentChannel) {
            item.classList.add('focused');
        } else {
            item.classList.remove('focused');
        }
    });
}
function showInfo() {
    infoVisible = true;
    document.getElementById('info').style.display = 'block';
    clearTimeout(infoTimeout);
    infoTimeout = setTimeout(() => {
        document.getElementById('info').style.display = 'none';
        infoVisible = false;
    }, 3000);
}
function handleKeyDown(e) {
    const keyCode = e.keyCode;
    console.log('Tecla pressionada:', keyCode);
    if (document.getElementById('urlInput').style.display !== 'none') {
        if (keyCode === 13) {
            loadPlaylist();
        }
        return;
    }
    switch(keyCode) {
        case 13:
            if (listVisible) {
                toggleChannelList();
            } else {
                toggleChannelList();
            }
            break;
        case 37:
            if (!listVisible) toggleChannelList();
            break;
        case 39:
            if (listVisible) toggleChannelList();
            break;
        case 38:
            if (listVisible) {
                if (currentChannel > 0) {
                    playChannel(currentChannel - 1);
                }
            } else {
                if (currentChannel < channels.length - 1) {
                    playChannel(currentChannel + 1);
                }
            }
            e.preventDefault();
            break;
        case 40:
            if (listVisible) {
                if (currentChannel < channels.length - 1) {
                    playChannel(currentChannel + 1);
                }
            } else {
                if (currentChannel > 0) {
                    playChannel(currentChannel - 1);
                }
            }
            e.preventDefault();
            break;
        case 415:
            player.play();
            showInfo();
            break;
        case 19:
            player.pause();
            showInfo();
            break;
        case 413:
            player.pause();
            player.currentTime = 0;
            break;
        case 417:
            if (currentChannel < channels.length - 1) {
                playChannel(currentChannel + 1);
            }
            break;
        case 412:
            if (currentChannel > 0) {
                playChannel(currentChannel - 1);
            }
            break;
        case 461:
            if (listVisible) {
                toggleChannelList();
            } else {
                player.pause();
                document.getElementById('urlInput').style.display = 'block';
            }
            break;
        case 48: case 49: case 50: case 51: case 52:
        case 53: case 54: case 55: case 56: case 57:
            const num = keyCode - 48;
            if (num < channels.length) {
                playChannel(num);
            }
            break;
    }
}
player.addEventListener('error', function(e) {
    console.error('Erro no player:', e);
    showInfo();
    document.getElementById('channelName').textContent = 'Erro ao carregar canal';
});
player.addEventListener('waiting', function() {
    document.getElementById('channelName').textContent = 'Buffering...';
    showInfo();
});
player.addEventListener('playing', function() {
    showInfo();
});