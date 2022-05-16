import {render, replace, remove} from '../framework/render.js';
import FilmCardView from '../view/film-card-view.js';
import PopupFilmView from '../view/popup-film-view.js';

const Mode = {
  DEFAULT: 'DEFAULT',
  OPENED: 'OPENED',
};

export default class FilmPresenter {
  #filmListContainer = null;
  #filmComponent = null;
  #popupComponent = null;
  #changeData = null;
  #changeMode = null;

  #movie = null;
  #mode = Mode.DEFAULT;

  constructor(filmListContainer, changeData, changeMode) {
    this.#filmListContainer = filmListContainer;
    this.#changeData = changeData;
    this.#changeMode = changeMode;
  }

  init = (movie) => {
    this.#movie = movie;

    const prevFilmComponent = this.#filmComponent;
    const prevPopupComponent = this.#popupComponent;

    this.#filmComponent = new FilmCardView(movie);
    this.#popupComponent = new PopupFilmView(movie);

    this.#filmComponent.setWatchlistClickHandler(this.#onWatchListClick);
    this.#filmComponent.setAlreadyWatchedClickHandler(this.#onAlreadyWatchedClick);
    this.#filmComponent.setFavoriteClickHandler(this.#onFavoriteClick);

    this.#filmComponent.setClickHandler(() => {
      this.#openPopup(movie);
    });

    this.#popupComponent.setCloseClickHandler(() => {
      this.#closePopup(movie);
    });

    if (prevFilmComponent === null || prevPopupComponent === null) {
      render(this.#filmComponent, this.#filmListContainer);
      return;
    }

    if (this.#filmListContainer.contains(prevFilmComponent.element)) {
      replace(this.#filmComponent, prevFilmComponent);
    }

    if (this.#mode === Mode.OPENED) {
      replace(this.#popupComponent, prevPopupComponent);
    }

    remove(prevFilmComponent);
    remove(prevPopupComponent);
  };

  destroy = () => {
    remove(this.#filmComponent);
    remove(this.#popupComponent);
  };

  resetView = () => {
    if (this.#mode !== Mode.DEFAULT) {
      this.#openPopup();
    }
  };

  #openPopup = () => {
    render(this.#popupComponent, document.body);
    document.body.classList.add('hide-overflow');

    this.#changeMode();
    this.#mode = Mode.OPENED;
  };

  #closePopup = () => {
    remove(this.#popupComponent);
    document.body.classList.remove('hide-overflow');

    this.#mode = Mode.DEFAULT;
  };

  #onWatchListClick = () => {
    this.#changeData({...this.#movie, watchlist: !this.#movie.userDetails.watchlist});
  };

  #onAlreadyWatchedClick = () => {
    this.#changeData({...this.#movie, alreadyWatched: !this.#movie.userDetails.alreadyWatched});
  };

  #onFavoriteClick = () => {
    this.#changeData({...this.#movie, favorite: !this.#movie.userDetails.favorite});
  };

}
