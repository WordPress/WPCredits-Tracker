/* global fytData */
( function () {
	'use strict';

	// -------------------------------------------------------------------------
	// State
	// -------------------------------------------------------------------------

	const questions     = fytData.questions;
	const i18n          = fytData.i18n;
	const MAX_SELECTIONS = 3;

	let currentIndex = 0;
	const answers    = {};   // questionId -> [{ answerId, tags[] }, ...]

	// -------------------------------------------------------------------------
	// DOM refs (resolved after DOMContentLoaded)
	// -------------------------------------------------------------------------

	let quiz, intro, body, results;
	let startBtn, backBtn, nextBtn;
	let questionContainer, progressBar, progressLabel;

	// -------------------------------------------------------------------------
	// Init
	// -------------------------------------------------------------------------

	document.addEventListener( 'DOMContentLoaded', function () {
		quiz              = document.getElementById( 'fyt-quiz' );
		intro             = document.getElementById( 'fyt-intro' );
		body              = document.getElementById( 'fyt-quiz-body' );
		results           = document.getElementById( 'fyt-results' );
		startBtn          = document.getElementById( 'fyt-start-btn' );
		backBtn           = document.getElementById( 'fyt-back-btn' );
		nextBtn           = document.getElementById( 'fyt-next-btn' );
		questionContainer = document.getElementById( 'fyt-question-container' );
		progressBar       = document.getElementById( 'fyt-progress-bar' );
		progressLabel     = document.getElementById( 'fyt-progress-label' );

		if ( ! quiz ) return;

		startBtn.addEventListener( 'click', startQuiz );
		backBtn.addEventListener( 'click', goBack );
		nextBtn.addEventListener( 'click', goNext );
	} );

	// -------------------------------------------------------------------------
	// Navigation
	// -------------------------------------------------------------------------

	function startQuiz() {
		intro.hidden = true;
		body.hidden  = false;
		renderQuestion( 0 );
	}

	function goNext() {
		const q    = questions[ currentIndex ];
		const saved = answers[ q.id ];

		if ( ! saved || saved.length === 0 ) {
			showInlineError( i18n.selectOne );
			return;
		}

		removeInlineError();

		if ( currentIndex < questions.length - 1 ) {
			currentIndex++;
			renderQuestion( currentIndex );
		} else {
			submitAndShowResults();
		}
	}

	function goBack() {
		removeInlineError();
		if ( currentIndex > 0 ) {
			currentIndex--;
			renderQuestion( currentIndex );
		}
	}

	// -------------------------------------------------------------------------
	// Render question
	// -------------------------------------------------------------------------

	function renderQuestion( index ) {
		const q        = questions[ index ];
		const isLast   = index === questions.length - 1;
		const qType    = q.type === 'radio' ? 'radio' : 'checkbox';
		const saved    = answers[ q.id ] || [];
		const savedIds = saved.map( function ( a ) { return a.answerId; } );
		const atMax    = qType === 'checkbox' && saved.length >= MAX_SELECTIONS;

		// Progress
		const progress = Math.round( ( index / questions.length ) * 100 );
		progressBar.style.width   = progress + '%';
		progressLabel.textContent = i18n.questionOf
			.replace( '%1$s', index + 1 )
			.replace( '%2$s', questions.length );

		// Build answer list
		const listRole   = qType === 'radio' ? 'radiogroup' : 'group';
		let answersHtml  = '<ul class="fyt-answers" role="' + listRole + '" aria-labelledby="fyt-question-text">';

		q.answers.forEach( function ( a ) {
			const isChecked  = savedIds.indexOf( a.id ) !== -1;
			const isDisabled = atMax && ! isChecked;

			answersHtml +=
				'<li class="fyt-answer">' +
					'<label class="fyt-answer__label' + ( isDisabled ? ' fyt-answer__label--disabled' : '' ) + '" for="fyt-a-' + esc( a.id ) + '">' +
						'<input type="' + qType + '"' +
							' id="fyt-a-' + esc( a.id ) + '"' +
							' name="fyt-q-' + esc( q.id ) + ( qType === 'checkbox' ? '[]' : '' ) + '"' +
							' value="' + esc( a.id ) + '"' +
							' data-tags="' + esc( JSON.stringify( a.tags ) ) + '"' +
							( isChecked  ? ' checked'  : '' ) +
							( isDisabled ? ' disabled' : '' ) +
						'>' +
						'<span class="fyt-answer__dot" aria-hidden="true"></span>' +
						'<span class="fyt-answer__text">' + esc( a.text ) + '</span>' +
					'</label>' +
				'</li>';
		} );
		answersHtml += '</ul>';

		questionContainer.innerHTML =
			'<p class="fyt-question__text" id="fyt-question-text">' + esc( q.text ) + '</p>' +
			( qType === 'checkbox' ? '<p class="fyt-question__hint">' + esc( i18n.selectUpTo ) + '</p>' : '' ) +
			answersHtml;

		// Enable/disable Next
		nextBtn.disabled    = saved.length === 0;
		nextBtn.textContent = isLast ? i18n.seeResults : i18n.next;

		// Back button
		backBtn.hidden = index === 0;

		// Wire up change listeners
		const inputs = questionContainer.querySelectorAll( 'input[type="radio"], input[type="checkbox"]' );

		inputs.forEach( function ( input ) {
			input.addEventListener( 'change', function () {
				const tags = JSON.parse( this.dataset.tags );

				if ( qType === 'radio' ) {
					// Single select — replace the whole array
					answers[ q.id ] = [ { answerId: this.value, tags: tags } ];
				} else {
					// Multi select — add or remove
					if ( ! answers[ q.id ] ) {
						answers[ q.id ] = [];
					}
					if ( this.checked ) {
						answers[ q.id ].push( { answerId: this.value, tags: tags } );
					} else {
						answers[ q.id ] = answers[ q.id ].filter( function ( a ) {
							return a.answerId !== input.value;
						} );
					}

					// Enforce max selections
					const currentCount = answers[ q.id ].length;
					const currentIds   = answers[ q.id ].map( function ( a ) { return a.answerId; } );
					inputs.forEach( function ( other ) {
						const isSelected    = currentIds.indexOf( other.value ) !== -1;
						const shouldDisable = ! isSelected && currentCount >= MAX_SELECTIONS;
						other.disabled      = shouldDisable;
						const lbl = other.closest( '.fyt-answer__label' );
						if ( lbl ) {
							lbl.classList.toggle( 'fyt-answer__label--disabled', shouldDisable );
						}
					} );
				}

				nextBtn.disabled = answers[ q.id ].length === 0;
				removeInlineError();
			} );
		} );

		// Focus the question for accessibility
		const questionText = document.getElementById( 'fyt-question-text' );
		if ( questionText ) {
			questionText.setAttribute( 'tabindex', '-1' );
			questionText.focus();
		}
	}

	// -------------------------------------------------------------------------
	// Submit & results
	// -------------------------------------------------------------------------

	function submitAndShowResults() {
		// Collect all selected tags across all questions
		const allTags = [];
		Object.values( answers ).forEach( function ( answerArray ) {
			answerArray.forEach( function ( a ) {
				a.tags.forEach( function ( t ) { allTags.push( t ); } );
			} );
		} );

		// Show loading
		body.hidden       = true;
		results.hidden    = false;
		results.innerHTML = '<div class="fyt-loading"><div class="fyt-loading__spinner"></div><p>' + esc( i18n.loading ) + '</p></div>';

		// Build form data
		const formData = new FormData();
		formData.append( 'action', 'fyt_get_results' );
		formData.append( 'nonce',  fytData.nonce );
		allTags.forEach( function ( tag ) { formData.append( 'tags[]', tag ); } );

		fetch( fytData.ajaxUrl, {
			method:      'POST',
			credentials: 'same-origin',
			body:        formData,
		} )
			.then( function ( r ) { return r.json(); } )
			.then( function ( data ) {
				if ( data.success ) {
					renderResults( data.data );
				} else {
					renderError( data.data || 'An error occurred.' );
				}
			} )
			.catch( function () {
				renderError( 'Could not reach the server. Please try again.' );
			} );
	}

	function renderResults( data ) {
		const top    = data.top;
		const others = data.others;

		const arrowSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

		let html = '';

		// Top team card
		html +=
			'<p class="fyt-results__heading">' + esc( i18n.yourTopTeam ) + '</p>' +
			'<div class="fyt-card--top">' +
				'<span class="fyt-card__icon" aria-hidden="true">' + esc( top.icon ) + '</span>' +
				'<h2 class="fyt-card__name">' + esc( top.name ) + '</h2>' +
				'<p class="fyt-card__description">' + esc( top.description ) + '</p>' +
				'<a class="fyt-card__cta" href="' + esc( top.url ) + '" target="_blank" rel="noopener noreferrer">' +
					esc( i18n.visitTeam ) + ' ' + arrowSvg +
				'</a>' +
			'</div>';

		// Other teams
		if ( others && others.length ) {
			html += '<p class="fyt-others__heading">' + esc( i18n.otherTeams ) + '</p><div class="fyt-others__grid">';
			others.forEach( function ( t ) {
				html +=
					'<a class="fyt-card--small" href="' + esc( t.url ) + '" target="_blank" rel="noopener noreferrer">' +
						'<span class="fyt-card__icon" aria-hidden="true">' + esc( t.icon ) + '</span>' +
						'<span class="fyt-card__name">' + esc( t.name ) + '</span>' +
						'<span class="fyt-card__description">' + esc( t.description ) + '</span>' +
					'</a>';
			} );
			html += '</div>';
		}

		// Footer actions
		html +=
			'<div class="fyt-results__footer">' +
				'<button class="fyt-btn fyt-btn--ghost" id="fyt-restart-btn">' + esc( i18n.restart ) + '</button>' +
				'<a class="fyt-btn fyt-btn--outline" href="' + esc( i18n.exploreUrl ) + '" target="_blank" rel="noopener noreferrer">' + esc( i18n.exploreMore ) + '</a>' +
			'</div>';

		results.innerHTML = html;

		// Complete progress bar
		progressBar.style.width = '100%';

		// Wire restart
		document.getElementById( 'fyt-restart-btn' ).addEventListener( 'click', restartQuiz );
	}

	function renderError( message ) {
		results.innerHTML = '<div class="fyt-error">' + esc( message ) + '</div>';
	}

	// -------------------------------------------------------------------------
	// Restart
	// -------------------------------------------------------------------------

	function restartQuiz() {
		currentIndex = 0;
		Object.keys( answers ).forEach( function ( k ) { delete answers[ k ]; } );

		results.hidden    = true;
		results.innerHTML = '';
		body.hidden       = false;

		progressBar.style.width = '0%';

		renderQuestion( 0 );
	}

	// -------------------------------------------------------------------------
	// Error helpers
	// -------------------------------------------------------------------------

	function showInlineError( msg ) {
		removeInlineError();
		const el = document.createElement( 'p' );
		el.id        = 'fyt-inline-error';
		el.className = 'fyt-error';
		el.setAttribute( 'role', 'alert' );
		el.textContent = msg;
		questionContainer.appendChild( el );
	}

	function removeInlineError() {
		const el = document.getElementById( 'fyt-inline-error' );
		if ( el ) el.remove();
	}

	// -------------------------------------------------------------------------
	// Utility: escape HTML entities
	// -------------------------------------------------------------------------

	function esc( str ) {
		if ( typeof str !== 'string' ) return '';
		return str
			.replace( /&/g,  '&amp;' )
			.replace( /</g,  '&lt;' )
			.replace( />/g,  '&gt;' )
			.replace( /"/g,  '&quot;' )
			.replace( /'/g,  '&#039;' );
	}
} )();
