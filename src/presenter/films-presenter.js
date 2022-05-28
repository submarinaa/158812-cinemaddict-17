import {render, remove} from '../framework/render.js';
import {SHOW_FILM_COUNT_STEP, SortType, UpdateType, UserAction} from '../const.js';
import FilmSectionView from '../view/film-section-view.js';
import FilmContainerView from '../view/film-container-view.js';
import LoadMoreButtonView from '../view/load-more-button-view.js';
import NoFilmCardView from '../view/no-film-card-view.js';
import SortView from '../view/sort-view.js';
import FilmPresenter from './film-presenter.js';
import {sortFilmsByRating, sortFilmsByDate} from '../utils/task.js';

export default class FilmsPresenter {

  #filmSection = new FilmSectionView;
  #filmContainer = new FilmContainerView;
  #loadMoreButtonComponent = null;
  #noFilmComponent = new NoFilmCardView();
  #sortComponent = null;

  #movieModel = null;
  #filmListContainer = null;
  #renderedMovieCount = SHOW_FILM_COUNT_STEP;

  #filmPresenter = new Map();
  #currentSortType = SortType.DEFAULT;

  constructor(filmListContainer, movieModel) {
    this.#filmListContainer = filmListContainer;
    this.#movieModel = movieModel;

    this.#movieModel.addObserver(this.#handleModelEvent);
  }

  get movies() {
    switch (this.#currentSortType) {
      case SortType.RATING:
        return [...this.#movieModel.movies].sort(sortFilmsByRating);
      case SortType.DATE:
        return [...this.#movieModel.movies].sort(sortFilmsByDate);
    }

    return this.#movieModel.movies;
  }

  init = () => {
    this.#renderMovie();
  };

  #handleLoadMoreButtonClick = () => {
    const movieCount = this.movies.length;
    const newRenderedMovieCount = Math.min(movieCount, this.#renderedMovieCount + SHOW_FILM_COUNT_STEP);
    const movies = this.movies.slice(this.#renderedMovieCount, newRenderedMovieCount);

    this.#renderFilms(movies);
    this.#renderedMovieCount = newRenderedMovieCount;

    if (this.#renderedMovieCount >= movieCount) {
      remove(this.#loadMoreButtonComponent);
    }
  };

  #renderFilms = (movies) => {
    movies.forEach((element) => this.#createFilm(element));
  };

  #renderNoFilms = () => {
    render(this.#noFilmComponent, this.#filmListContainer);
  };

  #renderLoadMoreButton = () => {
    this.#loadMoreButtonComponent = new LoadMoreButtonView();
    this.#loadMoreButtonComponent.setClickLoadHandler(this.#handleLoadMoreButtonClick);

    render(this.#loadMoreButtonComponent, this.#filmSection.element);
  };

  #clearFilmList = () => {
    this.#filmPresenter.forEach((presenter) => presenter.destroy());
    this.#filmPresenter.clear();
    this.#renderedMovieCount = SHOW_FILM_COUNT_STEP;
    remove(this.#loadMoreButtonComponent);
  };

  #clearFilm = ({resetRenderedMovieCount = false, resetSortType = false} = {}) => {
    const movieCount = this.movies.length;

    this.#filmPresenter.forEach((presenter) => presenter.destroy());
    this.#filmPresenter.clear();

    remove(this.#sortComponent);
    remove(this.#noFilmComponent);
    remove(this.#loadMoreButtonComponent);

    if (resetRenderedMovieCount) {
      this.#renderedMovieCount = SHOW_FILM_COUNT_STEP;
    } else {
      // На случай, если перерисовка доски вызвана
      // уменьшением количества задач (например, удаление или перенос в архив)
      // нужно скорректировать число показанных задач
      this.#renderedMovieCount = Math.min(movieCount, this.#renderedMovieCount);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DEFAULT;
    }
  };

  #handleModeChange = () => {
    this.#filmPresenter.forEach((presenter) => presenter.resetView());
  };

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_MOVIE:
        this.#movieModel.updateTask(updateType, update);
        break;
      case UserAction.ADD_MOVIE:
        this.#movieModel.addTask(updateType, update);
        break;
      case UserAction.DELETE_MOVIE:
        this.#movieModel.deleteTask(updateType, update);
        break;
    }
  };

  #handleModelEvent = (updateType, data) => {
    //console.log(updateType, data);
    switch (updateType) {
      case UpdateType.PATCH:
        // - обновить часть списка (например, когда поменялось описание)
        this.#filmPresenter.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        // - обновить список (например, когда задача ушла в архив)
        this.#clearFilm();
        this.#renderMovie();
        break;
      case UpdateType.MAJOR:
        // - обновить всю доску (например, при переключении фильтра)
        this.#clearFilm({resetRenderedMovieCount: true, resetSortType: true});
        this.#renderMovie();
        break;
    }
  };

  #createFilm = (movie) => {
    const filmPresenter = new FilmPresenter(this.#filmContainer.element, this.#handleViewAction, this.#handleModeChange);
    filmPresenter.init(movie);
    this.#filmPresenter.set(movie.id, filmPresenter);
  };

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearFilmList({resetRenderedMovieCount: true});
    this.#renderFilmsList();
  };

  #renderSort = () => {
    this.#sortComponent = new SortView(this.#currentSortType);
    this.#sortComponent.setSortTypeChangeHandler(this.#handleSortTypeChange);

    render(this.#sortComponent, this.#filmListContainer);
  };

  #renderFilmsList = () => {
    const movieCount = this.movies.length;
    const movies = this.movies.slice(0, Math.min(movieCount, SHOW_FILM_COUNT_STEP));

    render(this.#filmSection, this.#filmListContainer);

    render(this.#filmContainer, this.#filmSection.element);

    this.#renderFilms(movies);

    if (movieCount > SHOW_FILM_COUNT_STEP) {
      this.#renderLoadMoreButton();
    }
  };

  #renderMovie = () => {
    const movies = this.movies;
    const movieCount = movies.length;

    if (movieCount === 0) {
      this.#renderNoFilms();
      return;
    }

    this.#renderSort();

    render(this.#filmContainer, this.#filmSection.element);

    this.#renderFilmsList(movies.slice(0, Math.min(movieCount, this.#renderedMovieCount)));

    if (movieCount > this.#renderedMovieCount) {
      //this.#renderLoadMoreButton();
    }
  };
}
