import AbstractView from '../framework/view/abstract-view.js';
import {humanizeCommentDateTime} from '../utils/task.js';
import he from 'he';

const createComment = (comments, deletingCommentId) => {
  const {comment, date, emotion, author, id, isDisabled} = comments;

  return (`
  <li class="film-details__comment">
    <span class="film-details__comment-emoji">
      <img src="./images/emoji/${emotion}.png" width="55" height="55" alt="${emotion}">
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

export default class CommentPopupView extends AbstractView {
  get template() {
    return createComment();
  }
}

export {createComment};
