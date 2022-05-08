import {createElement} from '../render.js';
import {humanizeDueDate} from '../utils.js';

const createComment = (comments) => {
  const {comment, date, emotion, author} = comments;

  return (`
  <li class="film-details__comment">
    <span class="film-details__comment-emoji">
      <img src="./images/emoji/${emotion}.png" width="55" height="55" alt="${emotion}">
    </span>
    <div>
      <p class="film-details__comment-text"> ${comment}</p>
      <p class="film-details__comment-info">
        <span class="film-details__comment-author">${author}</span>
        <span class="film-details__comment-day">${humanizeDueDate(date)}</span>
        <button class="film-details__comment-delete">Delete</button>
      </p>
    </div>
  </li>`);
};

export default class CommentView {

  constructor(comment) {
    this.comment = comment;
  }

  getTemplate() {
    return createComment(this.comment);
  }

  getElement() {
    if (!this.element) {
      this.element = createElement(this.getTemplate());
    }
    return this.element;
  }

  removeElement() {
    this.element = null;
  }
}
