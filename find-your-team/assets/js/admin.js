( function () {
	'use strict';

	// -------------------------------------------------------------------------
	// Accordion
	// -------------------------------------------------------------------------

	function toggleItem( item, forceOpen ) {
		const body     = item.querySelector( '.fyt-item__body' );
		const toggle   = item.querySelector( '.fyt-item__toggle' );
		const isOpen   = item.classList.contains( 'is-open' );
		const open     = forceOpen !== undefined ? forceOpen : ! isOpen;

		item.classList.toggle( 'is-open', open );
		body.hidden = ! open;
		if ( toggle ) toggle.setAttribute( 'aria-expanded', String( open ) );
	}

	document.addEventListener( 'click', function ( e ) {
		const toggle = e.target.closest( '.fyt-item__toggle' );
		if ( toggle ) {
			toggleItem( toggle.closest( '.fyt-item' ) );
		}
	} );

	// Expand / Collapse All
	document.addEventListener( 'click', function ( e ) {
		if ( e.target.id === 'fyt-expand-all' ) {
			document.querySelectorAll( '.fyt-item' ).forEach( function ( item ) {
				toggleItem( item, true );
			} );
		}
		if ( e.target.id === 'fyt-collapse-all' ) {
			document.querySelectorAll( '.fyt-item' ).forEach( function ( item ) {
				toggleItem( item, false );
			} );
		}
	} );

	// -------------------------------------------------------------------------
	// Live-update accordion label when question text changes
	// -------------------------------------------------------------------------

	document.addEventListener( 'input', function ( e ) {
		if ( e.target.classList.contains( 'fyt-q-text-input' ) ) {
			const item  = e.target.closest( '.fyt-item' );
			const label = item && item.querySelector( '.fyt-item__label' );
			if ( label ) {
				label.textContent = e.target.value || 'New Question';
			}
		}
		if ( e.target.classList.contains( 'fyt-t-name-input' ) ) {
			const item  = e.target.closest( '.fyt-item' );
			const label = item && item.querySelector( '.fyt-item__label' );
			if ( label ) {
				label.textContent = e.target.value || 'New Team';
			}
		}
	} );

	// -------------------------------------------------------------------------
	// Remove question / team
	// -------------------------------------------------------------------------

	document.addEventListener( 'click', function ( e ) {
		const btn = e.target.closest( '.fyt-item__remove' );
		if ( ! btn ) return;

		const item = btn.closest( '.fyt-item' );
		const type = item && item.dataset.type;
		const msg  = type === 'team'
			? 'Remove this team? This cannot be undone.'
			: 'Remove this question? This cannot be undone.';

		if ( window.confirm( msg ) ) {
			item.remove();
		}
	} );

	// -------------------------------------------------------------------------
	// Add question
	// -------------------------------------------------------------------------

	var addQuestionBtn = document.getElementById( 'fyt-add-question' );
	if ( addQuestionBtn ) {
		addQuestionBtn.addEventListener( 'click', function () {
			var list = document.getElementById( 'fyt-questions-list' );
			var idx  = parseInt( list.dataset.qCounter || '0', 10 );
			list.dataset.qCounter = idx + 1;

			var item = buildQuestionItem( idx );
			list.appendChild( item );
			toggleItem( item, true );
			item.querySelector( '.fyt-q-text-input' ).focus();
		} );
	}

	function buildQuestionItem( qIdx ) {
		var prefix = 'fyt_questions[' + qIdx + ']';
		var id     = 'q_new_' + qIdx;

		var el = document.createElement( 'div' );
		el.className = 'fyt-item';
		el.setAttribute( 'data-type', 'question' );
		el.innerHTML =
			'<div class="fyt-item__header">' +
				'<button type="button" class="fyt-item__toggle" aria-expanded="false">' +
					'<span class="fyt-item__icon dashicons dashicons-arrow-right-alt2"></span>' +
					'<span class="fyt-item__label">New Question</span>' +
				'</button>' +
				'<button type="button" class="fyt-item__remove button-link-delete">Remove</button>' +
			'</div>' +
			'<div class="fyt-item__body" hidden>' +
				'<input type="hidden" name="' + esc( prefix ) + '[id]" value="' + esc( id ) + '">' +
				'<table class="form-table fyt-form-table"><tr>' +
					'<th><label>Question Text</label></th>' +
					'<td><input type="text" name="' + esc( prefix ) + '[text]" value="" class="large-text fyt-q-text-input" required placeholder="Enter the question…"></td>' +
				'</tr></table>' +
				'<div class="fyt-answers-header">' +
					'<strong>Answers</strong>' +
					'<span class="fyt-answers-hint">Tags are comma-separated keywords used to match contributors to teams.</span>' +
				'</div>' +
				'<div class="fyt-answers-col-headers">' +
					'<span class="col-text">Answer text</span>' +
					'<span class="col-tags">Tags (comma-separated)</span>' +
					'<span class="col-remove"></span>' +
				'</div>' +
				'<div class="fyt-answers-list" data-a-counter="0"></div>' +
				'<button type="button" class="fyt-add-answer button button-secondary">+ Add Answer</button>' +
			'</div>';

		return el;
	}

	// -------------------------------------------------------------------------
	// Add / remove answer
	// -------------------------------------------------------------------------

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest( '.fyt-add-answer' );
		if ( ! btn ) return;

		var body       = btn.closest( '.fyt-item__body' );
		var list       = body.querySelector( '.fyt-answers-list' );
		var item       = btn.closest( '.fyt-item' );
		var qIdx       = getItemIndex( item, '#fyt-questions-list .fyt-item' );
		var aIdx       = parseInt( list.dataset.aCounter || '0', 10 );
		list.dataset.aCounter = aIdx + 1;

		var prefix = 'fyt_questions[' + qIdx + '][answers][' + aIdx + ']';
		var row    = buildAnswerRow( prefix, 'a_new_' + qIdx + '_' + aIdx );
		list.appendChild( row );
		row.querySelector( '.fyt-input-answer-text' ).focus();
	} );

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest( '.fyt-remove-answer' );
		if ( ! btn ) return;
		btn.closest( '.fyt-answer-row' ).remove();
	} );

	function buildAnswerRow( prefix, id ) {
		var row = document.createElement( 'div' );
		row.className = 'fyt-answer-row';
		row.innerHTML =
			'<input type="hidden" name="' + esc( prefix ) + '[id]" value="' + esc( id ) + '">' +
			'<div class="fyt-answer-row__fields">' +
				'<input type="text" name="' + esc( prefix ) + '[text]" value="" class="fyt-input-answer-text" placeholder="Answer text…" required>' +
				'<input type="text" name="' + esc( prefix ) + '[tags]" value="" class="fyt-input-answer-tags" placeholder="tag1, tag2, tag3">' +
				'<button type="button" class="fyt-remove-answer button-link-delete" aria-label="Remove answer">×</button>' +
			'</div>';
		return row;
	}

	// -------------------------------------------------------------------------
	// Add team
	// -------------------------------------------------------------------------

	var addTeamBtn = document.getElementById( 'fyt-add-team' );
	if ( addTeamBtn ) {
		addTeamBtn.addEventListener( 'click', function () {
			var list = document.getElementById( 'fyt-teams-list' );
			var idx  = parseInt( list.dataset.tCounter || '0', 10 );
			list.dataset.tCounter = idx + 1;

			var item = buildTeamItem( idx );
			list.appendChild( item );
			toggleItem( item, true );
			item.querySelector( '.fyt-t-name-input' ).focus();
		} );
	}

	function buildTeamItem( tIdx ) {
		var prefix = 'fyt_teams[' + tIdx + ']';
		var id     = 'team_new_' + tIdx;

		var el = document.createElement( 'div' );
		el.className = 'fyt-item';
		el.setAttribute( 'data-type', 'team' );
		el.innerHTML =
			'<div class="fyt-item__header">' +
				'<button type="button" class="fyt-item__toggle" aria-expanded="false">' +
					'<span class="fyt-item__icon dashicons dashicons-arrow-right-alt2"></span>' +
					'<span class="fyt-item__label">New Team</span>' +
				'</button>' +
				'<button type="button" class="fyt-item__remove button-link-delete">Remove</button>' +
			'</div>' +
			'<div class="fyt-item__body" hidden>' +
				'<input type="hidden" name="' + esc( prefix ) + '[id]" value="' + esc( id ) + '">' +
				'<table class="form-table fyt-form-table">' +
					'<tr>' +
						'<th><label>Team Name</label></th>' +
						'<td><input type="text" name="' + esc( prefix ) + '[name]" value="" class="regular-text fyt-t-name-input" required placeholder="e.g. Core"></td>' +
					'</tr>' +
					'<tr>' +
						'<th><label>Icon (emoji)</label></th>' +
						'<td><input type="text" name="' + esc( prefix ) + '[icon]" value="" class="fyt-icon-input" placeholder="⚙️"></td>' +
					'</tr>' +
					'<tr>' +
						'<th><label>Team URL</label></th>' +
						'<td><input type="url" name="' + esc( prefix ) + '[url]" value="" class="large-text" placeholder="https://make.wordpress.org/…"></td>' +
					'</tr>' +
					'<tr>' +
						'<th><label>Description</label></th>' +
						'<td><textarea name="' + esc( prefix ) + '[description]" class="large-text" rows="3" placeholder="Short description of the team…"></textarea></td>' +
					'</tr>' +
				'</table>' +
				'<div class="fyt-tags-header">' +
					'<strong>Tag Weights</strong>' +
					'<span class="fyt-answers-hint">Higher weight (1–10) = stronger match for that tag.</span>' +
				'</div>' +
				'<div class="fyt-tags-list" data-tag-counter="0"></div>' +
				'<button type="button" class="fyt-add-tag button button-secondary">+ Add Tag Weight</button>' +
			'</div>';

		return el;
	}

	// -------------------------------------------------------------------------
	// Add / remove tag weight
	// -------------------------------------------------------------------------

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest( '.fyt-add-tag' );
		if ( ! btn ) return;

		var body   = btn.closest( '.fyt-item__body' );
		var list   = body.querySelector( '.fyt-tags-list' );
		var item   = btn.closest( '.fyt-item' );
		var tIdx   = getItemIndex( item, '#fyt-teams-list .fyt-item' );
		var tagIdx = parseInt( list.dataset.tagCounter || '0', 10 );
		list.dataset.tagCounter = tagIdx + 1;

		var prefix = 'fyt_teams[' + tIdx + '][tags][' + tagIdx + ']';
		var row    = buildTagRow( prefix );
		list.appendChild( row );
		row.querySelector( '.fyt-input-tag-name' ).focus();
	} );

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest( '.fyt-remove-tag' );
		if ( ! btn ) return;
		btn.closest( '.fyt-tag-row' ).remove();
	} );

	function buildTagRow( prefix ) {
		var row = document.createElement( 'div' );
		row.className = 'fyt-tag-row';
		row.innerHTML =
			'<input type="text" name="' + esc( prefix ) + '[tag]" value="" class="fyt-input-tag-name" placeholder="tagname">' +
			'<input type="number" name="' + esc( prefix ) + '[weight]" value="3" class="fyt-input-tag-weight" min="1" max="10">' +
			'<button type="button" class="fyt-remove-tag button-link-delete" aria-label="Remove tag">×</button>';
		return row;
	}

	// -------------------------------------------------------------------------
	// Reset to defaults (submit hidden form after confirm)
	// -------------------------------------------------------------------------

	document.addEventListener( 'click', function ( e ) {
		var link = e.target.closest( '.fyt-reset-link' );
		if ( ! link ) return;
		e.preventDefault();

		var which = link.dataset.form;
		if ( ! window.confirm( 'Reset all ' + which + ' to their built-in defaults? Your customisations will be lost.' ) ) {
			return;
		}
		var form = document.getElementById( 'fyt-reset-' + which + '-form' );
		if ( form ) form.submit();
	} );

	// -------------------------------------------------------------------------
	// Copy shortcode button
	// -------------------------------------------------------------------------

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest( '.fyt-copy-btn' );
		if ( ! btn ) return;
		var text = btn.dataset.clipboardText;
		if ( ! text ) return;

		navigator.clipboard.writeText( text ).then( function () {
			var orig = btn.textContent;
			btn.textContent = 'Copied!';
			btn.classList.add( 'copied' );
			setTimeout( function () {
				btn.textContent = orig;
				btn.classList.remove( 'copied' );
			}, 2000 );
		} ).catch( function () {
			window.prompt( 'Copy this shortcode:', text );
		} );
	} );

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	/**
	 * Get the position index of an item within a selector-matched set.
	 * Used to determine correct field name indices for newly-added nested items.
	 */
	function getItemIndex( item, listSelector ) {
		var all = Array.from( document.querySelectorAll( listSelector ) );
		return all.indexOf( item );
	}

	function esc( str ) {
		if ( typeof str !== 'string' ) return '';
		return str
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#039;' );
	}

} )();
