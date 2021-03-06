import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import {humanizeFormatDate, humanizeDurationFormat, humanizeCommentDateTime} from '../utils/task.js';
import {EMOJIS} from '../const.js';
import he from 'he';

const createEmotion = (emoji) => emoji && `<img src="./images/emoji/${emoji}.png" width="55" height="55" alt="emoji">`;

const createComment = (comments, deletingCommentId) => {
  const {comment, date, emotion, author, id, isDisabled} = comments;

  return (`
  <li class="film-details__comment">
    <span class="film-details__comment-emoji">
      ${createEmotion(emotion)}
    </span>
    <div>
      <p class="film-details__comment-text">${he.encode(String(comment))}</p>
      <p class="film-details__comment-info">
        <span class="film-details__comment-author">${author}</span>
        <span class="film-details__comment-day">${humanizeCommentDateTime(date)}</span>
        <button class="film-details__comment-delete" data-button-id="${id}" ${isDisabled ? 'disabled' : ''}>
          ${deletingCommentId === id ? 'Deleting...' : 'Delete'}
        </button>
      </p>
    </div>
  </li>`);
};

const createFilmDetailsPopupTemplate = (movie, isDisabled) => {

  const {
    filmInfo: {
      title,
      totalRating,
      poster,
      director,
      writers,
      actors,
      runtime,
      description,
      genre,
      release: {
        date,
        releaseCountry
      },
      ageRating
    },
    comments,
    userDetails,
    commentEmoji,
    commentInput
  } = movie;

  const releaseDate = humanizeFormatDate(date, 'D MMMM YYYY');

  const createGenres = () => {
    const genresLayout = genre.reduce((result, item) => (
      `${result}
        <span class="film-details__genre">${item}</span>`
    ), '');

    const genresTitle = genre.length === 1
      ? 'Genre'
      : 'Genres';

    return `
    <td class="film-details__term">${genresTitle}</td>
    <td class="film-details__cell">${genresLayout}</td>`;
  };

  const getControlClassName = (option) => option
    ? 'film-details__control-button--active'
    : '';

  const createAddCommentTemplate = (emoji, comment, abortingFormSubmit, isSaving) => {
    const emojiImg = emoji ? createEmotion(emoji) : '';
    const newComment = comment ? comment : '';

    return `<div class="film-details__add-emoji-label">${emojiImg}</div>
      <label class="film-details__comment-label">
        <textarea class="film-details__comment-input ${abortingFormSubmit ? 'shake' : ''}" ${isSaving ? 'disabled' : ''}
        placeholder="Select reaction below and write comment here" name="comment">${newComment}</textarea>
      </label>`;
  };

  const createEmojiListTemplate = (currentEmoji) => (
    EMOJIS.map((emoji) =>
      `<input class="film-details__emoji-item visually-hidden" name="comment-emoji" type="radio" id="emoji-${emoji}" value="${emoji}" ${currentEmoji === emoji ? 'checked' : ''}>
      <label class="film-details__emoji-label" for="emoji-${emoji}">
        <img src="./images/emoji/${emoji}.png" width="30" height="30" alt="emoji">
      </label>`).join('')
  );

  const listComments = comments.map((comment) => createComment(comment, movie.deletingCommentId)).join('');

  return (`
  <section class="film-details">
    <form class="film-details__inner" action="" method="get">
      <div class="film-details__top-container">
        <div class="film-details__close">
          <button class="film-details__close-btn" type="button">close</button>
        </div>
        <div class="film-details__info-wrap">
          <div class="film-details__poster">
            <img class="film-details__poster-img" src="./${poster}" alt="${title}">
            <p class="film-details__age">${ageRating}+</p>
          </div>
          <div class="film-details__info">
            <div class="film-details__info-head">
              <div class="film-details__title-wrap">
                <h3 class="film-details__title">${title}</h3>
                <p class="film-details__title-original">Original: ${title}</p>
              </div>
              <div class="film-details__rating">
                <p class="film-details__total-rating">${totalRating}</p>
              </div>
            </div>
            <table class="film-details__table">
              <tr class="film-details__row">
                <td class="film-details__term">Director</td>
                <td class="film-details__cell">${director}</td>
              </tr>
              <tr class="film-details__row">
                <td class="film-details__term">Writers</td>
                <td class="film-details__cell">${writers}</td>
              </tr>
              <tr class="film-details__row">
                <td class="film-details__term">Actors</td>
                <td class="film-details__cell">${actors}</td>
              </tr>
              <tr class="film-details__row">
                <td class="film-details__term">Release Date</td>
                <td class="film-details__cell">${releaseDate}</td>
              </tr>
              <tr class="film-details__row">
                <td class="film-details__term">Runtime</td>
                <td class="film-details__cell">${humanizeDurationFormat(runtime)}</td>
              </tr>
              <tr class="film-details__row">
                <td class="film-details__term">Country</td>
                <td class="film-details__cell">${releaseCountry}</td>
              </tr>
              <tr class="film-details__row">
                ${createGenres(genre)}
              </tr>
            </table>
            <p class="film-details__film-description">
              ${description}
            </p>
          </div>
        </div>
        <section class="film-details__controls">
          <button type="button" class="film-details__control-button film-details__control-button--watchlist ${getControlClassName(userDetails.watchlist)}" id="watchlist" name="watchlist" ${isDisabled ? 'disabled' : ''}>Add to watchlist</button>
          <button type="button" class="film-details__control-button film-details__control-button--watched ${getControlClassName(userDetails.alreadyWatched)}" id="watched" name="watched" ${isDisabled ? 'disabled' : ''}>Already watched</button>
          <button type="button" class="film-details__control-button film-details__control-button--favorite ${getControlClassName(userDetails.favorite)}" id="favorite" name="favorite" ${isDisabled ? 'disabled' : ''}>Add to favorites</button>
        </section>
      </div>
      <div class="film-details__bottom-container">
        <section class="film-details__comments-wrap">
          <h3 class="film-details__comments-title">Comments <span class="film-details__comments-count">${comments.length}</span></h3>
          <ul class="film-details__comments-list">
            ${listComments}
          </ul>
          <div class="film-details__new-comment">
            ${createAddCommentTemplate(commentEmoji, commentInput, movie.abortingFormSubmit)}
            <div class="film-details__emoji-list">
              ${createEmojiListTemplate(commentEmoji)}
            </div>
          </div>
        </section>
      </div>
    </form>
  </section>`);
};

export default class PopupFilmView extends AbstractStatefulView {

  constructor (movie) {
    super();
    this._state = PopupFilmView.parseCommentToState(movie);

    this.#setInnerHandlers();
  }

  get template() {
    return createFilmDetailsPopupTemplate(this._state);
  }

  #textInputHandler = (evt) => {
    evt.preventDefault();
    this._setState({
      commentInput: evt.target.value,
    });
  };

  #emojiChangeHandler = (evt) => {
    if (evt.target.nodeName === 'INPUT') {
      evt.preventDefault();
      const scrollPosition = this.element.scrollTop;
      this.updateElement({
        commentEmoji: evt.target.value,
      });
      this.element.scrollTop = scrollPosition;
    }
  };

  #setInnerHandlers = () => {
    this.element.querySelector('.film-details__emoji-list')
      .addEventListener('click', this.#emojiChangeHandler);

    this.element.querySelector('.film-details__comment-input')
      .addEventListener('input', this.#textInputHandler);
  };

  reset = (movie) => {
    this.updateElement(
      PopupFilmView.parseCommentToState(movie),
    );
  };

  setCloseClickHandler = (callback) => {
    this._callback.closeClick = callback;
    this.element.querySelector('.film-details__close-btn').addEventListener('click', this.#closeClickHandler);
  };

  #closeClickHandler = (evt) => {
    evt.preventDefault();
    this._callback.closeClick();
    document.body.classList.remove('hide-overflow');
  };

  setWatchlistClickHandler = (callback) => {
    this._callback.toWatchListClick = callback;
    this.element.querySelector('.film-details__control-button--watchlist').addEventListener('click', this.#watchListClickHandler);
  };

  #watchListClickHandler = (evt) => {
    evt.preventDefault();
    this._callback.toWatchListClick();
  };

  setAlreadyWatchedClickHandler = (callback) => {
    this._callback.alreadyWatchedClick = callback;
    this.element.querySelector('.film-details__control-button--watched').addEventListener('click', this.#alreadyWatchedClickHandler);
  };

  #alreadyWatchedClickHandler = (evt) => {
    evt.preventDefault();
    this._callback.alreadyWatchedClick();
  };

  setFavoriteClickHandler = (callback) => {
    this._callback.favoriteClick = callback;
    this.element.querySelector('.film-details__control-button--favorite').addEventListener('click', this.#favoriteClickHandler);
  };

  #favoriteClickHandler = (evt) => {
    evt.preventDefault();
    this._callback.favoriteClick();
  };

  setAddCommentHandler = (callback) => {
    this._callback.addComment = callback;
    document.addEventListener('keydown', this.#onAddComment);
  };

  resetAddCommentHandler = () => {
    document.removeEventListener('keydown', this.#onAddComment);
  };

  #onAddComment = (evt) => {
    const scrollPosition = this.element.scrollTop;
    if (evt.ctrlKey && evt.key === 'Enter') {
      evt.preventDefault();

      if(this._state.commentEmoji && this._state.commentInput) {
        this._callback.addComment(PopupFilmView.parseStateToComment(this._state), PopupFilmView.newComment(this._state));
      }
      this.resetAddCommentHandler();
    }
    this.element.scrollTop = scrollPosition;
  };

  setDeleteCommentHandler = (callback) => {
    this._callback.deleteComment = callback;

    const deleteButtons = this.element.querySelectorAll('.film-details__comment-delete');
    deleteButtons.forEach((button) => {
      button.addEventListener('click', this.#onCommentDelete);
    });
  };

  #onCommentDelete = (evt) => {
    evt.preventDefault();
    const scrollPosition = this.element.scrollTop;
    const isDeleteButton = evt.target.dataset.buttonId;

    let commentId = null;

    const index = this._state.comments.findIndex((item) => item.id === isDeleteButton);

    if (index !== -1) {
      commentId = this._state.comments[index].id;
    }

    this._callback.deleteComment(commentId);

    this.updateElement({
      ...this._state
    });

    this.element.scrollTop = scrollPosition;
  };

  _restoreHandlers = () => {
    this.#setInnerHandlers();

    this.setCloseClickHandler(this._callback.closeClick);
    this.setWatchlistClickHandler(this._callback.toWatchListClick);
    this.setAlreadyWatchedClickHandler(this._callback.alreadyWatchedClick);
    this.setFavoriteClickHandler(this._callback.favoriteClick);

    this.setDeleteCommentHandler(this._callback.deleteComment);
    this.setAddCommentHandler(this._callback.addComment);
  };

  static parseCommentToState = (movie) => (
    {...movie,
      commentEmoji: null,
      commentInput: null,
      isDisabled: false,
      isDeleting: false,
      isSaving: false,
    }
  );

  static parseStateToComment = (state) => {
    const movie = { ...state };

    delete movie.commentEmoji;
    delete movie.commentInput;
    delete movie.isDeleting;
    delete movie.isDisabled;
    delete movie.isSaving;

    return movie;
  };

  static newComment = (state) => ({
    emotion: state.commentEmoji,
    comment: state.commentInput,
  });
}
