/**
 * This js file is linked to pokedex.html and pokedex.css. This will generate
 * the pokedex and build up the fighting phase for pokemons. It contains will
 * add the defeted unowned pokemon to your collection.
 */
"use strict";
(function() {
  const NAME_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php?pokedex=all";
  const NUMBER_OF_POKEMON = 151;
  const SPRITES_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/";
  const ABILITY_MAX = 4;
  const DATA_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php?pokemon=";
  const ICONS_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/icons/";
  const URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const GAME_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php";
  let textResponse = "";
  let guidAndId = [];
  let alreadySet = false;
  let selectedPoke = "";
  window.addEventListener("load", getName());

  /**
   * this set up one pokemon for pokebox. The pokemon's id and alt will be its
   * name.
   * @param {String} res - name of the pokemon
   */
  function setUpOnePokemon(res) {
    let board = document.getElementById("pokedex-view");
    let newImg = document.createElement('img');
    newImg.src = SPRITES_URL + res + ".png";
    newImg.alt = res;
    newImg.id = res;
    newImg.classList.add('sprite');
    board.appendChild(newImg);
    if (newImg.id === "bulbasaur" || newImg.id === "charmander" ||
    newImg.id === "squirtle") {
      found(newImg);
    }
    newImg.addEventListener('click', function() {
      getData(newImg.id);
    })
  }

  /**
   * Set up event listener for move buttons. This will only set once every game.
   * @param {element} moves - buttons for moves.
   */
  function setUpMoves(moves) {
    if (!alreadySet){
      for (let i = 0; i < moves.length; i++) {
        moves[i].addEventListener("click", function() {
          battleRequest(this);
        });
      }
      alreadySet = true;
    }
  }

  /**
   * Make a fetch on GAME_URL using the last move user choose.
   * @param {element} ele - the move button that user clicked.
   */
  async function battleRequest(ele) {
    let moveName = (ele.querySelector("img").alt);
    let data = new FormData();
	  data.append("guid", guidAndId[0]);
    data.append("pid", guidAndId[1]);
	  data.append("movename", moveName);
    loading();
	  fetch (GAME_URL, {method: "POST", body: data})
		  .then (statusCheck)
      .then (res => res.json())
      .then (updateS)
      .then (finishLoading)
      .catch (error)
  }

  /**
   * update the status of hp and paragraph. Call youWin or youLoss based on
   * the hp.
   * @param {Object} res - response from POSTing on GAME_URL.
   * @return {Object} response from POSTing on GAME_URL.
   */
  function updateS(res) {
    updateHp(res.p1['current-hp'], res.p1.hp, "p1");
    updateHp(res.p2['current-hp'], res.p2.hp, "p2");
    updateParagraph(res.results);
    if (res.p1['current-hp'] === 0) {
      youLoss();
    } else if (res.p2['current-hp'] === 0){
      youWin(res);
    }
    return res;
  }

  /**
   * update the part in between the two pokemon fights. It will show their
   * last move and show if they missed or not. If player 2 died form the last
   * player 1 attact, the player 2 move will not be shown.
   * @param {Object} result - result part of the respond.
   */
  function updateParagraph(result) {
    let p1 = document.querySelector('#p1-turn-results');
    let p2 = document.querySelector('#p2-turn-results');
    visible(p1);
    visible(p2);
    p1.textContent = "Player 1 played " + result['p1-move'] + " and " +
    result['p1-result'] + "\n";
    p2.textContent = "Player 2 played " + result['p2-move'] + " and " +
    result['p2-result'] + "\n";
  }

  /**
   * This function is called when the user loss.
   * It will change the h1 textContent to You Loss.
   */
  function youLoss() {
    document.querySelector('h1').textContent = "You Loss!"
    cleanUp();
  }

  /**
   * This function is called when the user win the fight.
   * It will change the h1 to You Win! and call cleanUp()
   * @param {respond} res - the respond from fetch. Usually from the GAME_URL.
   */
  function youWin(res) {
    document.querySelector('h1').textContent = "You Win!";
    invisible(document.querySelector('#p2-turn-results'));
    cleanUp();
    let id = res.p2.shortname;
    found(document.getElementById(id));//element of the image
  }

  /**
   * This method does everything that will happen when the game end but user
   * is still on the fighting page.
   */
  function cleanUp() {
    let endGameButton = document.querySelector("#endgame")
    visible(endGameButton);
    endGameButton.addEventListener('click', endGame);
    invisible(document.querySelector("#flee-btn"));
    let bottons = document.querySelectorAll("#p1 .moves button");
    for (let i = 0; i < bottons.length; i++) {
      bottons[i].disabled = true;
    }
  }

  /**
   * Does everything that will happen when a game end. It will close the fight
   * page and come back to the pokedex.
   * Meanwhile, it sets everything for the new game.
   */
  function endGame() {
    visible(document.getElementById("pokedex-view"));
    invisible(document.querySelector("#results-container"));
    invisible(document.querySelector("#endgame"));
    invisible(document.querySelector("#p2"));
    invisible(document.querySelector("#p1 .hp-info"));
    visible(document.querySelector("#start-btn"));
    getData(selectedPoke);
    updateHp(1, 1, "p1");
    updateHp(1, 1, "p2");
    document.querySelector("#endgame").removeEventListener('click', endGame);
    let p1 = document.querySelector('#p1-turn-results');
    let p2 = document.querySelector('#p2-turn-results');
    invisible(p1);
    invisible(p2);
    document.querySelector('h1').textContent = "Your Pokedex";
  }

  /**
   * Update the hp bar based on the given values. The bar will turn to red if
   * the health is lower or equal to 20%.
   * @param {DOMList} currentHp - the current hp of the pokemon
   * @param {number} maxHp - the max hp of the pokemon.
   * @param {String} name - name of the pokemon. Either "p1" or "p2".
   */
  function updateHp(currentHp, maxHp, name) {
    let health = document.querySelector("#" + name + " .health-bar");
    let currentHealth =  currentHp / maxHp  * 100;
    health.style.width = currentHealth + "%";
    if (currentHealth <= 20) {
      health.classList.add('low-health');
    } else {
      health.classList.remove('low-health');
    }
  }

  /**
   * Add class found to the founded pokemon.
   * @param {found} element - name of the founded pokemon.
   */
  function found(element) {
    element.classList.add('found');
  }

  /**
   * make a fetch to DATA_URL and set up p1 based on the response from web.
   * @param {String} element - name of the pokemon for set up p1.
   */
  async function getData(element) {
    selectedPoke = element;
    fetch(DATA_URL + element)
      .then(statusCheck)
      .then(res => res.json())
      .then(setP1View)
      .catch(error);
  }

  /**
   * Transfer a long name to short name. Short name won't have space and it is
   * all lower cased.
   * @param {String} str - input String
   * @return {String} the short name.
   */
  function longNameToShortName(str) {
    return str.replace(/\s+/g, '').toLowerCase();
  }

  /**
   * visible the start-btn button while calling setCardView using respond and
   * #p1. This basically set up the P1.
   * @param {response} response - response from fetch
   */
  async function setP1View(respond) {
    setCardView(respond, "#p1")
    let botton = document.querySelector("#start-btn");
    botton.addEventListener('click', gameView);
    visible(botton);
  }

  /**
   * call setCardView and set guidAndId for respond.guid and respond.pid
   * These two values is going to be used in future POST fetch for GAME_URL.
   * @param {response} response - response from fetch
   */
  async function setP2View(respond) {
    setCardView(respond.p2, "#p2");
    guidAndId = [respond.guid, respond.pid];
  }

  /**
   * Make the loading animation to be visible.
   * @param {response} response - response from fetch
   * @return {response} return the response from fetch
   */
  function loading(res) {
    visible(document.querySelector("#loading"));
    return res;
  }

  /**
   * this will set the loading animation to be invisible.
   * @param {response} response - response from fetch
   * @return {response} return the response from fetch
   */
  function finishLoading(res) {
    invisible(document.querySelector("#loading"));
    return res;
  }

  /**
   * Using the given respond, set up every part of the card.
   * This includes all the icons, images, and names.
   * @param {respond} respond - list of all selected cards to check if a set.
   * @param {String} card - #p1 or #p2. For locating the imgs, icons, and names.
   */
  async function setCardView(respond, card) {
    textResponse = respond.shortname;
    applyChildToParent(card + ' .name', respond.name);
    applyChildToParentImg(card + ' .pokepic', URL + respond.images.photo, "photo");
    applyChildToParentImg(card + ' .type', URL + respond.images.typeIcon, "typeIcon");
    applyChildToParentImg(card + ' .weakness', URL + respond.images.weaknessIcon, "weaknessIcon");
    applyChildToParent(card + ' .hp', respond.hp + "HP");
    applyChildToParent(card + ' .info', respond.info.description);
    for (let i = 0; i < ABILITY_MAX; i++) {
      if (respond.moves.length > i ) {
        parent = document.querySelectorAll(card + " .moves button");
        parent[i].classList.remove('hidden');
        parent = document.querySelectorAll(card + " .moves .move");
        parent[i].textContent = respond.moves[i].name;
        if (respond.moves[i].dp != null){
          parent = document.querySelectorAll(card +' .dp');
          parent[i].textContent = respond.moves[i].dp +" DP";
        } else {
          parent = document.querySelectorAll(card +' .dp');
          parent[i].textContent = "";
        }
        parent = document.querySelectorAll(card + " .moves img");
        parent[i].src = ICONS_URL + respond.moves[i].type + ".jpg";
        parent[i].alt = longNameToShortName(respond.moves[i].name);
      } else {
        let parent = document.querySelectorAll(card + " .moves button");
        parent[i].classList.add('hidden');
      }
    }
  }

  /**
   * Does everything after flee, which means user loss and the p1 hp is set to
   * 0
   */
  function fleeAction() {
    youLoss();
    updateHp(0, 1, "p1");
  }

  /**
   * Set the game to game view, where the two pokemon fight each other.
   * This includes the POST to GAME_URL and calling setP2View()
   * it also calls setUpMoves and able all moves button for p1.
   */
  function gameView() {
    visible(document.getElementById('p2'));
    invisible(document.getElementById('pokedex-view'));
    let hpBar = document.querySelectorAll('.hp-info');
    for (let i = 0; i < hpBar.length; i++) {
      visible(hpBar[i]);
    }
    visible(document.querySelector('#results-container'));
    let flee = document.querySelector('#p1 #flee-btn');
    visible(flee);
    flee.addEventListener('click', fleeAction);
    invisible(document.querySelector('#start-btn'));
    let bottons = document.querySelectorAll('#p1 .moves button');
    for (let i = 0; i < bottons.length; i++) {
      if (!bottons[i].classList.contains('hidden')){
        bottons[i].disabled = false;
      }
    }
    setUpMoves(bottons);
    document.querySelector('h1').textContent = 'Pokemon Battle!';
    let data = new FormData();
    data.append("startgame", "true");
    data.append("mypokemon", textResponse);
    fetch (GAME_URL, {method: "POST", body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(setP2View)
      .catch(error);
  }

  /**
   * Remove class hidden to the input element.
   * @param {element} ele - selected element to be visible
   */
  function visible(ele) {
    ele.classList.remove('hidden');
  }
  /**
   * Add class hidden to the input element.
   * @param {element} ele - selected element to be invisible
   */
  function invisible(ele) {
    ele.classList.add('hidden');
  }

  /**
   * Apply content to the income value, parent.
   * @param {String} parent - the String to use with querySelector
   * @param {String} content - the text content that is going to with parent.
   */
  function applyChildToParent(parent, content) {
    parent = document.querySelector(parent);
    parent.textContent = content;
  }

  /**
   * Change the content of imgs based on the inputs.
   * @param {String} parent - the String for querySelector
   * @param {String} url - the url is going to be with parent.
   * @param {String} alt - the alt is going to be with parent.
   */
  function applyChildToParentImg(parent, url, alt) {
    parent = document.querySelector(parent);
    parent.src = url;
    parent.alt = alt;
  }

  /**
   * fetch for getting the name. Name will be in form of text.
   */
  async function getName() {
    fetch(NAME_URL)
      .then(statusCheck)
      .then(res => res.text())
      .then(changeText)
      .catch(error);
  }

  /**
   * splite the text into an array on every \n, and then take each lowercase
   * short name put them into setUpOnePokemon.
   * @param {response} response - the promise made by any fetch
   * @return {response} return the promise made by fetch.
   */
  async function changeText (res) {
    let arr = res.split('\n');
    let pattern = /:[a-z-]*/;
    for (let i = 0; i < NUMBER_OF_POKEMON; i++) {
      res = arr[i].match(pattern)[0].substring(1);
      setUpOnePokemon(res);
    }
    return res;
  }

  /**
   * Check the status of the response and throw error if the ok is false.
   * @param {promise} response - the promise made by any fetch
   * @return {response} return the promise made by fetch.
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.txt());
    }
    console.log(response);
    return response;
  }

  /**
   * Report an error by change the text in h1.
   */
  function error() {
    document.querySelector("h1").textContent = "Something went wrong";
  }
}());