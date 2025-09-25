class PopupManager {
    constructor() {
        this.popupQueue = [];
        this.isDisplaying = false;
        this.popupElement = null;
        this.messageElement = null;
        this.closeButton = null;
    }

    createPopup() {
        if (this.popupElement) return;

        this.popupElement = document.createElement('div');
        this.popupElement.id = 'popup';
        this.popupElement.classList.add('popup-hidden');

        this.messageElement = document.createElement('p');
        this.popupElement.appendChild(this.messageElement);

        this.closeButton = document.createElement('button');
        this.closeButton.textContent = 'Close';
        this.closeButton.addEventListener('click', () => this.hidePopup());
        this.popupElement.appendChild(this.closeButton);

        document.body.appendChild(this.popupElement);
    }

    addMessage(message, delay = 0) {
        setTimeout(() => {
            this.popupQueue.push(message);
            if (!this.isDisplaying) {
                this.displayNextMessage();
            }
        }, delay);
    }

    displayNextMessage() {
        if (this.popupQueue.length === 0) {
            this.isDisplaying = false;
            return;
        }

        this.isDisplaying = true;
        const message = this.popupQueue.shift();
        this.messageElement.textContent = message;
        this.popupElement.classList.remove('popup-hidden');
    }

    hidePopup() {
        this.popupElement.classList.add('popup-hidden');
        this.isDisplaying = false;
        // Show next message after a short delay to allow for animation
        setTimeout(() => this.displayNextMessage(), 500);
    }
}

const popupManager = new PopupManager();
popupManager.createPopup();
