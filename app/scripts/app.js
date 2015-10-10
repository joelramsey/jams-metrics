var blocJamsAngular = angular.module('blocJamsAngular', ['ui.router']);

blocJamsAngular.config(function ($stateProvider, $locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

    $stateProvider.state('landing', {
            url: '/',
            controller: 'Landing.controller',
            templateUrl: '/templates/landing.html'
        })
        .state('collection', {
            url: '/collection',
            controller: 'Collection.controller',
            templateUrl: '/templates/collection.html'
        })
        .state('album', {
            url: '/album',
            controller: 'Album.controller',
            templateUrl: '/templates/album.html'
        });
});

//Controllers

blocJamsAngular.controller('Landing.controller', ['$scope', function ($scope) {
    $scope.welcome = 'Turn the music up!';
}]);

blocJamsAngular.controller('Collection.controller', ['$scope', function ($scope) {
    var albumsArray = [];
    for (var i = 0; i < 8; i++) {
        var currentAlbum = angular.copy(albumPicasso);
        albumsArray.push(currentAlbum);
    }

    $scope.albums = albumsArray;
}]);

blocJamsAngular.controller('Album.controller', ['$scope', 'filteredTimeFilter', 'Player', function ($scope, filteredTimeFilter, Player) {
    $scope.currentAlbum = Player.currentAlbum;
    $scope.currentSoundFile = Player.currentSoundFile;
    $scope.isPlaying = Player.playing;
    $scope.currentSongInAlbum = $scope.currentAlbum.songs[Player.currentSongIndex];
    $scope.duration = null;
    $scope.prog = 0;
    $scope.vol = Player.currentVolume;
    window.scope = $scope;
    $scope.$on('newValue', function (event, data) {
        if (data.element.attr('bound-value') === 'prog') {
            Player.seek(data.value);
        } else if (data.element.attr('bound-value') === 'vol') {
            Player.setVolume(data.value);
        }
    });


    $scope.playPause = function (songIndex) {
        if (Player.currentSongIndex === songIndex) {
            if (Player.playing) {
                Player.pause();
            } else {
                Player.play();
            }
        } else {
            Player.setSong(songIndex);
            Player.getSongDuration()
            $scope.currentSongTime();
            Player.play();
        }
    };


    $scope.currentSongTime = function () {
        Player.currentSoundFile.unbind('timeupdate');
        Player.currentSoundFile.bind('timeupdate', function timeUpdate(event) {
            $scope.$apply(function () {
                $scope.currentTime = filteredTimeFilter(Player.currentSoundFile.getTime());
                $scope.duration = filteredTimeFilter(Player.getSongDuration());
            })
        });
    };


    var hoverSongIndex = null;

    $scope.hoverIn = function (songIndex) {
        hoverSongIndex = songIndex;
    };

    $scope.hoverOut = function () {
        hoverSongIndex = null;
    };

    $scope.getState = function (songIndex) {
        if (Player.playing && songIndex === Player.currentSongIndex) {
            return 'playing';
        } else if (songIndex === hoverSongIndex) {
            return 'hovering';
        }
        return 'default';
    };

    $scope.nextSong = function () {
        Player.nextSong();
        $scope.currentSongInAlbum = $scope.currentAlbum.songs[Player.currentSongIndex];
        $scope.currentSongTime();
    };

    $scope.previousSong = function () {
        Player.previousSong();
        $scope.currentSongInAlbum = $scope.currentAlbum.songs[Player.currentSongIndex];
        $scope.currentSongTime();

    };

    $scope.playSong = function () {
        $scope.isPlaying = Player.playing;
        if (Player.playing) {
            Player.pause();
        } else {
            Player.play();
            $scope.currentSongTime();
        }
        $scope.isPlaying = Player.playing;
        $scope.$on('song:timeupdate', function (event, data) {
            $timeout(function () {
                $scope.currentTimeSecs = data;
                $scope.currentTime = formatTimeFilter(data);
            }, 0);
            $scope.prog = ($scope.currentTimeSecs / $scope.totalTimeSecs) * 100;
        });
    };




}]);

//Services

blocJamsAngular.factory('Player', function () {
    var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
    var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
    var playerBarPlayButton = '<span class="ion-play"></span>';
    var playerBarPauseButton = '<span class="ion-pause"></span>';

    return {
        currentAlbum: albumPicasso,
        currentSoundFile: null,
        currentSongIndex: 0,
        currentSongInAlbum: null,
        currentVolume: 80,
        currentSongTime: 0,
        playing: false,
        pause: function () {
            this.playing = false;
            this.paused = true;
            this.currentSoundFile.pause();
        },

        play: function () {
            this.playing = true;
            this.paused = false;
            if (this.currentSoundFile === null) {
                this.setSong(this.currentSongIndex);
            }
            this.currentSoundFile.play();
            this.setVolume(this.currentVolume);

        },

        nextSong: function () {
            this.currentSongIndex++;
            if (this.currentSongIndex === this.currentAlbum.songs.length) {
                this.currentSongIndex = 0;
            }
            this.setSong(this.currentSongIndex);
            this.play();

        },

        previousSong: function () {
            this.currentSongIndex--;
            if (this.currentSongIndex === -1) {
                this.currentSongIndex = this.currentAlbum.songs.length - 1;
            }
            this.setSong(this.currentSongIndex);
            this.play();

        },

        setSong: function (songIndex) {
            if (this.currentSoundFile) {
                this.currentSoundFile.stop();
            }
            this.currentSongIndex = songIndex;
            this.currentSongFromAlbum = this.currentAlbum.songs[songIndex];
            this.currentSoundFile = new buzz.sound(albumPicasso.songs[songIndex].audioUrl, {
                formats: ['mp3'],
                preload: true
            });
            this.setVolume(this.currentVolume);
        },

        isPlaying: function (songIndex) {
            if (this.currentSongIndex === songIndex && this.paused === false) {
                this.playing = true;
            } else
                this.playing = false;
        },

        setVolume: function (value) {
            if (this.currentSoundFile) {
                this.currentSoundFile.setVolume(value);
                this.volume = value;
            }
        },

        updateSeekBarWhileSongPlays: function () {

            if (this.currentSoundFile) {

                this.currentSoundFile.bind('timeupdate', function timeUpdate(event) {

                });
            }
        },

        getSongDuration: function () {
            if (this.currentSoundFile) {
                return this.currentSoundFile.getDuration();
            }
        },

        seek: function (percent) {
            if (this.currentSoundFile) {
                var ratio = percent / 100;
                var newTime = this.currentSoundFile.getDuration() * ratio;
                this.currentSoundFile.setTime(newTime);
            }
        },
        duration: function () {
            if (currentSoundFile) {
                return currentSoundFile.getDuration();
            }
        }
    }
});

//Directives

blocJamsAngular.directive('slider', ['$document', function ($document) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            boundValue: '='
        },
        templateUrl: '/templates/slider.html',
        link: function (scope, element, attrs) {
            scope.value = 0;

            scope.setThumb = function (value) {
                $(element).find('.thumb').css({
                    left: parseInt(value) + '%'
                });
            };

            scope.setFill = function (value) {
                $(element).find('.fill').css({
                    width: parseInt(value) + '%'
                });
            };

            scope.setValue = function (newVal) {
                scope.value = parseInt(newVal);
                scope.$emit('newValue', {
                    value: scope.value,
                    element: element
                });
            };

            scope.setSeek = function (ratio) {
                var offsetPercent = ratio * 100;
                offsetPercent = Math.max(0, offsetPercent);
                offsetPercent = Math.min(100, offsetPercent);
                scope.setThumb(offsetPercent);
                scope.setFill(offsetPercent);
                scope.setValue(offsetPercent);
            };

            scope.setSeek(scope.boundValue / 100);

            $(element).on('click', function (event) {
                var offset = event.pageX - $(element).offset().left;
                var barWidth = $(element).width();
                var ratio = offset / barWidth;
                scope.setSeek(ratio);
            });

            scope.seek = function (event) {
                $(document).bind('mousemove.thumb', function (event) {
                    var offset = event.pageX - $(element).offset().left;
                    var barWidth = $(element).width();
                    var ratio = offset / barWidth;
                    scope.setSeek(ratio);
                });
                $(document).bind('mouseup.thumb', function () {
                    $(document).unbind('mousemove.thumb');
                    $(document).unbind('mouseup.thumb');
                });
            };

            scope.$watch('boundValue', function ($slider) {
                scope.setThumb(scope.boundValue);
                scope.setFill(scope.boundValue);

            });
        }
    };
}]);

//Filter

blocJamsAngular.filter('filteredTime', function () {
    return function (input) {
        var time = parseFloat(input);
        var minutes = Math.floor(input / 60);
        var seconds = Math.floor(input - minutes * 60);
        if (seconds >= 10) {
            var input = minutes + ":" + seconds;
        } else {
            var input = minutes + ":0" + seconds;
        }

        return input;
    };
});
