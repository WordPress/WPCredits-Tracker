<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="fyt-quiz" class="fyt-quiz" role="main" aria-label="<?php esc_attr_e( 'Find Your WordPress Contribution Team', 'find-your-team' ); ?>">

	<div class="fyt-intro" id="fyt-intro">
		<div class="fyt-intro__badge"><?php esc_html_e( 'Contributor Quiz', 'find-your-team' ); ?></div>
		<h2 class="fyt-intro__heading"><?php esc_html_e( 'Find Your WordPress Team', 'find-your-team' ); ?></h2>
		<p class="fyt-intro__description">
			<?php esc_html_e( 'Answer a few quick questions and we\'ll match you with the contribution team that fits you best. There are no wrong answers — just your interests!', 'find-your-team' ); ?>
		</p>
		<button class="fyt-btn fyt-btn--primary" id="fyt-start-btn">
			<?php esc_html_e( 'Get Started', 'find-your-team' ); ?>
		</button>
	</div>

	<div class="fyt-quiz__body" id="fyt-quiz-body" hidden>
		<div class="fyt-progress" aria-hidden="true">
			<div class="fyt-progress__bar" id="fyt-progress-bar"></div>
		</div>
		<p class="fyt-progress__label" id="fyt-progress-label"></p>

		<div class="fyt-question" id="fyt-question-container" aria-live="polite">
			<!-- Rendered by JS -->
		</div>

		<div class="fyt-quiz__nav">
			<button class="fyt-btn fyt-btn--ghost" id="fyt-back-btn" hidden>
				<?php esc_html_e( 'Back', 'find-your-team' ); ?>
			</button>
			<button class="fyt-btn fyt-btn--primary" id="fyt-next-btn" disabled>
				<?php esc_html_e( 'Next', 'find-your-team' ); ?>
			</button>
		</div>
	</div>

	<div class="fyt-results" id="fyt-results" hidden aria-live="polite">
		<!-- Rendered by JS -->
	</div>

</div>
