'use strict';

// Elements
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Classes
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // id is created based on the workout date
  constructor(coords, distance, duration) {
    this.coords = coords; // {lat, lng}
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.type = 'running';
    this._calcPace();
    this._setDescription();
  }
  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.type = 'cycling';
    this._calcSpeed();
    this._setDescription();
  }
  _calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}
class App {
  // Class fields
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];
  constructor() {
    //event listeners are written in constructor functions, so that called immediately after script loading & object creation
    this._getPosition();
    this._getLocalStorage();
    // in callback functions, Explicitly bind "this" else undefined
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // executed if location can be accessed
        this._loadMap.bind(this),
        function () {
          // executed if location cant be accessed
          alert('Location access denied');
        }
      );
    }
  }
  _loadMap(position) {
    // map loaded on user present coordinates
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    //   console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // past workouts from local storage are displayed on List & Map marker
    this.#workouts.forEach(work => {
      this._renderWorkoutList(work);
      this._renderWorkoutMarker(work);
    });
    // form displayed, if user clicks on any map coordinate
    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _newWorkout(e) {
    e.preventDefault();

    let workout;
    const { lat, lng } = this.#mapEvent.latlng;

    // Get data from form //

    const type = inputType.value; // getting value of 'Select' dropdown list

    const distance = Number(inputDistance.value);
    if (!Number.isFinite(distance) || distance < 0)
      return alert('Invalid input');

    const duration = Number(inputDuration.value);
    if (!Number.isFinite(duration) || duration < 0)
      return alert('Invalid input');

    // If workout == Running
    if (type === 'running') {
      const cadence = Number(inputCadence.value);
      if (!Number.isFinite(cadence) || cadence < 0)
        return alert('Invalid input');
      // Object of running class
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout == Cycling
    if (type === 'cycling') {
      const elevation = Number(inputElevation.value);
      if (!Number.isFinite(elevation)) return alert('Invalid input');
      // Object of cycling class
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add workout to list //
    this.#workouts.push(workout);

    // Render workout on list //
    this._renderWorkoutList(workout);

    // Render workout on map //
    this._renderWorkoutMarker(workout);

    // Reset form data //
    this._resetFormData();

    // Store all workouts in Local Storage //
    this._setLocalStorage();
  }
  _renderWorkoutList(workout) {
    // common part of workouts is pushed first
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    } else {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m</span>
        </div>
      </li> -->
      `;
    }
    // HTML insert after form
    form.insertAdjacentHTML('afterend', html);
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _moveToPopup(e) {
    // closest is used as user can click on any html element of workouts
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    // matching clicked workout ID by all workouts IDs
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // map moved to selected workout coordinate
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _toggleElevationField() {
    // form-row is on multiple elements, so cant directly toggle hidden class -- Instead go to parent of inputElevation where form-row is applied, then toggle
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _resetFormData() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // this data returned as a string, all functions gets reset, prototype inheritance gets reset
    if (!data) return;
    console.log('data', data);
    data.forEach(ele => this._recreatingData(ele));
    console.log('workouts array', this.#workouts);
    // this.#workouts = data;
  }
  _resetLocalStorage() {
    localStorage.removeItem('workouts');
    location.reload();
  }
  _recreatingData(ele) {
    let workout;
    if (ele.type === 'running') {
      // prettier-ignore
      workout = new Running(ele.coords, ele.distance, ele.duration,ele.cadence);
    } else {
      // prettier-ignore
      workout = new Cycling(ele.coords, ele.distance, ele.duration, ele.elevation);
    }
    // id, date, description are based on current date, hence need to be changed explicitly
    workout.id = ele.id;
    workout.date = ele.date;
    workout.description = ele.description;
    this.#workouts.push(workout);
  }
}
const app = new App();
