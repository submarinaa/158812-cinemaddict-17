import {render, RenderPosition, remove} from '../framework/render.js';
import {SHOW_FILM_COUNT_STEP, SortType, UpdateType, UserAction, FilterType, TimeLimit} from '../const.js';
import FilmSectionView from '../view/film-section-view.js';
import FilmContainerView from '../view/film-container-view.js';
import LoadMoreButtonView from '../view/load-more-button-view.js';
import NoFilmCardView from '../view/no-film-card-view.js';
import SortView from '../view/sort-view.js';
import LoadingView from '../view/loading-view.js';
import FilmPresenter from './film-presenter.js';
import {sortFilmsByRating, sortFilmsByDate} from '../utils/task.js';
import {filter} from '../utils/filter.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';

export default class FilmsPresenter {

  #filmSection = new FilmSectionView;
  #filmContainer = new FilmContainerView;
  #loadMoreButtonComponent = null;
  #loadingComponent = new LoadingView();
  #noFilmComponent = null;
  #sortComponent = null;
  #openedFilmPresenter = null;

  #movieModel = null;
  #filmListContainer = null;
  #renderedMovieCount = SHOW_FILM_COUNT_STEP;

  #filmPresenter = new Map();
  #currentSortType = SortType.DEFAULT;
  #filterType = FilterType.ALL;
  #isLoading = true;

  #filterModel = null;

  #uiBlocker = new UiBlocker(TimeLimit.LOWER_LIMIT, TimeLimit.UPPER_LIMIT);

  constructor(filmListContainer, movieModel, filterModel) {
    this.#filmListContainer = filmListContainer;
    this.#movieModel = movieModel;
    this.#filterModel = filterModel;

    this.#movieModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get movies() {
    this.#filterType = this.#filterModel.filter;
    const movies = this.#movieModel.movies;
    const filteredMovies = filter[this.#filterType](movies);

    switch (this.#currentSortType) {
      case SortType.RATING:
        return filteredMovies.sort(sortFilmsByRating);
      case SortType.DATE:
        return filteredMovies.sort(sortFilmsByDate);
    }

    return filteredMovies;
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
    this.#noFilmComponent = new NoFilmCardView(this.#filterType);
    render(this.#noFilmComponent, this.#filmSection.element);
  };

  #renderLoading = () => {
    render(this.#loadingComponent, this.#filmSection.element);
  };

  #renderLoadMoreButton = () => {
    this.#loadMoreButtonComponent = new LoadMoreButtonView();
    this.#loadMoreButtonComponent.setClickLoadHandler(this.#handleLoadMoreButtonClick);

    render(this.#loadMoreButtonComponent, this.#filmSection.element);
  };

  #clearFilm = ({resetRenderedMovieCount = false, resetSortType = false} = {}) => {
    const movieCount = this.movies.length;

    this.#filmPresenter.forEach((presenter) => {
      if (presenter.isOpened) {
        presenter.destroyOnlyCard();
        this.#openedFilmPresenter = presenter;
      } else {
        presenter.destroy();
      }
    });

    this.#filmPresenter.clear();

    remove(this.#sortComponent);
    remove(this.#loadingComponent);
    remove(this.#loadMoreButtonComponent);

    if (this.#noFilmComponent) {
      remove(this.#noFilmComponent);
    }

    if (resetRenderedMovieCount) {
      this.#renderedMovieCount = SHOW_FILM_COUNT_STEP;
    } else {
      this.#renderedMovieCount = Math.min(movieCount, this.#renderedMovieCount);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DEFAULT;
    }
  };

  #handleModeChange = () => {
    this.#filmPresenter.forEach((presenter) => presenter.resetView());
  };

  #handleViewAction = async (actionType, updateType, update) => {

    switch (actionType) {
      case UserAction.UPDATE_MOVIE:
        this.#uiBlocker.block();
        try {
          await this.#movieModel.updateFilm(updateType, update);
        } catch(err) {
          this.#filmPresenter.get(update.id).setAborting();
        }
        this.#uiBlocker.unblock();
        break;
      case UserAction.ADD_COMMENT:
        await this.#movieModel.updateFilm(updateType, update);
        break;
      case UserAction.DELETE_COMMENT:
        await this.#movieModel.updateFilm(updateType, update);
        break;
    }

  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#filmPresenter.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        this.#clearFilm();
        this.#renderMovie();
        break;
      case UpdateType.MAJOR:
        this.#clearFilm({resetRenderedMovieCount: true, resetSortType: true});
        this.#renderMovie();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderMovie();
        break;
    }
  };

  #createFilm = (movie) => {
    const filmPresenter = new FilmPresenter(
      this.#filmContainer.element,
      this.#handleViewAction,
      this.#handleModeChange,
    );
    filmPresenter.init(movie);
    this.#filmPresenter.set(movie.id, filmPresenter);
  };

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearFilm({resetRenderedMovieCount: true});

    this.#renderMovie();
  };

  #renderSort = () => {
    this.#sortComponent = new SortView(this.#currentSortType);
    this.#sortComponent.setSortTypeChangeHandler(this.#handleSortTypeChange);

    render(this.#sortComponent, this.#filmSection.element, RenderPosition.AFTERBEGIN);
  };

  #updateOpenedModal = () => {
    if (!this.#openedFilmPresenter) {
      return;
    }
    if (!this.#openedFilmPresenter.isOpened) {
      this.#openedFilmPresenter = null;
    }
    const currentModalData = this.#movieModel.movies.find((movie) => movie.id === this.#openedFilmPresenter?.movieId);
    if (currentModalData) {
      this.#openedFilmPresenter.init(currentModalData);
    }
  };

  #renderMovie = () => {
    render(this.#filmSection, this.#filmListContainer);

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    const movies = this.movies;
    const movieCount = movies.length;

    if (movieCount === 0) {
      this.#renderNoFilms();
      return;
    }

    this.#renderSort();
    render(this.#filmContainer, this.#filmSection.element);
    this.#updateOpenedModal();

    this.#renderFilms(movies.slice(0, Math.min(movieCount, this.#renderedMovieCount)));

    if (movieCount > this.#renderedMovieCount) {
      this.#renderLoadMoreButton();
    }
  };
}
