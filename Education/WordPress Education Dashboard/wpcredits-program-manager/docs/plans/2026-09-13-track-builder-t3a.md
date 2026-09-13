# Track Builder T3a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The question editor: a duplicated track's questions become editable on the Track Builder screen - added, edited one at a time on a page of their own, moved within their group, removed - with the fork that protects the tracks a column is shared with, the lock a published question keeps, the line that says what publishing would create, and Delete for a track that was never published.

**Architecture:** Three new units in the shape T2c used, so nothing grows a second job. `WPCPM_Track_Questions` is pure: every rule the editor needs, on a questions map, with no WordPress and no HTTP in it, so its suite needs neither. `WPCPM_Track_Editor` holds the five handlers, each running the capability check, then the nonce, then handing the decision to the pure class and the result to the store. `WPCPM_Track_Editor_Screen` draws the question list under a track's properties and the screen one question is edited on. The store gains the sharing index and a delete that refuses any track ever published; the Airtable client keeps its last schema read for fifteen minutes and only the editor's line reads that copy; `judge()` gains the one comparison it lacked, a select's choices. Every save goes through `WPCPM_Track_Store::check()`, the call the publish screen makes, so the editor and Publish can never disagree.

**Tech Stack:** WordPress 6.5 and PHP 7.4 as floors, WordPress coding standards, the plugin's standalone `bin/test-*.php` suites, no build step, and one small script (`assets/js/track-editor.js`) that moves a row in place the way `assets/js/modules.js` moves a Student Report Card module.

**Spec:** `docs/specs/2026-09-10-track-builder-design.md` at `ca6d0ee`: sections 5 and 6 for the editor, 4.2 for a question's properties, 11's T3a row for the tests, 12's T3a row for the phase, and decisions 21 to 26 in section 1, settled on 13 September 2026.

## Global Constraints

- **Start from `main` at 1.104.0.** `grep "^Stable tag" readme.txt` prints `Stable tag: 1.104.0` and `git status --short` prints nothing. Then `git switch -c track-builder-t3a`. Every block below was proven one commit at a time on `ca6d0ee` and replayed onto a fresh checkout.
- WordPress coding standards throughout: tabs, Yoda conditions, spaces inside parentheses, `array()` and never `[]`, strict `in_array()`. Everything that ships is PHP 7.4 compatible: no `match`, no named arguments, no union types, no arrow functions in a constant. Every string a person reads is US English. No em dash or en dash anywhere, in code, comments, docs or commit messages: a plain hyphen. Full product names ("Student Report Card", "Mentor Report Card", "Administrator Dashboard").
- Everything a person can see is escaped on output, and every handler checks capability first, then nonce, in that order (the design's decision 3.9). `bin/test-track-builder.php` fails if the two are swapped, on the editor's five handlers as on the builder's.
- **The battery stays silent after every task:** `for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done` prints nothing. `php bin/check-references.php`, `php bin/check-spelling.php` and `php bin/check-dead-annotations.php` report clean. `bash bin/check-standards.sh` prints no line containing ` ERROR `, and its last line reads `85 warnings, no errors.` or a lower count. Five things it counts are easy to trip, and four of them tripped while this plan was proven: the `=` of consecutive assignments align; the arrows of a multi-line array align, so a new key longer than the longest one there re-aligns every arrow in the block; a docblock needs a short description before its `@param`; a multi-line call's opening parenthesis is the last thing on its line, so `esc_html( sprintf( ... ) )` spread over lines is an error and the `sprintf()` goes into a variable first; and `$new` is a reserved word, refused as a parameter name.
- **Test first, every task:** add the checks, run them, see them fail as the step says, then write the code.
- **A suite drives the real class wherever the rule lives in one.** `bin/test-track-builder.php` loads the real `WPCPM_Track_Questions`, `WPCPM_Track_Columns`, `WPCPM_Track_Editor` and `WPCPM_Track_Editor_Screen`, and stands in only WordPress and the collaborators with side effects. Where it must stand in a reader, the stand-in is faithful: T2c's dominant finding class was a check that passed against a stand-in the real code did not match, and this plan met it twice while it was proven (a request reader that trimmed where the stand-in did not, and an `esc_js()` that encoded where the stand-in did not).
- **A column name is exact.** It is the question's key, verbatim, and an Airtable name can end in a space (4.2): the base's own `Company ` does. Every column name is read with `WPCPM_Request::posted_exact()` or `exact()`, never `posted_text()`, `posted_verbatim()` or `text()`, which all trim.
- **Nothing is deleted in Airtable, ever** (section 14, decision 9). Removing a question leaves its column and every answer in it, and the confirmation says so. The one thing this plan deletes is a WordPress post for a track that was never published (decision 25).
- Every new class file is required in `wpcredits-program-manager.php` and in `uninstall.php`, in that order, or `bin/test-roles.php` fails.
- Version numbers move in Task 11 only: plugin 1.105.0, which `version_compare()` orders after 1.104.0. No theme release.
- Comments explain why and name the decision or the review that made the rule. Every commit message starts with "Track Builder T3a:" and ends with the `Co-Authored-By:` trailer of whoever made it, after a blank line.

## What this plan decides

1. **The fork protects other tracks from your edit; the preflight protects your track from the base.** A shared question whose control, Airtable type or choices change takes `<column> - <key>` (the design's 5). A control whose Airtable type differs from a column already in the base is `judge()`'s `type_mismatch`, refused at publish. Neither does the other's job, and the handler forks only while the column is shared: after a fork nobody shares the new column, which is what stops it forking twice, and what makes "changing the control back" leave the forked column alone (section 5, as amended).
2. **A published question's column is locked, and so is its control** (decision 23). `handle_save()` refuses a different column name and refuses a change that would fork, each with the way round in the message: remove the question and add a new one with a column of its own. Its wording still changes.
3. **`airtable_type` is never a box.** `posted_question()` keeps the stored type while the control is unchanged and derives it from the control (`WPCPM_Track_Columns::TYPES`, or the link type for `team`) when the control changes or the question is new. A column that exists in the base with another type is the preflight's to refuse.
4. **Add asks for four things, not two.** Section 6 says the column name and the control; 4.2 makes `label` required and never a copy of the column name, so the add form asks for the words as well, and the group is the one whose Add was pressed. The new question is valid the moment it exists, and its screen opens.
5. **A question's screen draws the boxes of the control that was last typed.** Changing the control to one that needs more (text to number, say) is a two-step: choose it, save, fill in what the refusal names, save. Controls that need nothing more change in one.
6. **Move is per group.** `WPCPM_Track_Questions::move()` swaps a question with its neighbor in the same group, because the form draws group by group and a swap across a group boundary would reorder nothing a student sees. The script disables the arrow at a group's edge; without the script the form posts and comes back.
7. **The sharing index counts every other track, drafts included and marked.** A built-in track running from its PHP writes its columns; a draft does not yet, but will, so its label is followed by "(a draft)".
8. **A fork is worked out, not recorded.** `forked_from()` reads `<stem> - <key>` off the name and asks whether another track holds the stem, so a person who renames a forked column is not left with a stored flag that says something the name no longer does.
9. **Delete is the log's decision.** `ever_published()` reads the log for a `publish` entry, because unpublishing sets the post back to draft and the log is the one record that survives it. The list draws Delete only where the store would allow it.
10. **The schema line reads a cache the client fills on every successful read** (decision 24). `fetch_schema()` writes the transient; `cached_schema()` reads it or reads afresh; the preflight never calls `cached_schema()`. A column no control can create is left out of the line's count, because the preflight refuses it rather than creating it.
11. **`judge()` compares a select's choices, and the refusal names the absent ones** (decision 26). `missing_choices()` answers separately from the verdict so the message can list them.

## File structure

**Created**

| File | What it holds |
| --- | --- |
| `includes/tracks/class-wpcpm-track-questions.php` | Add, move, remove, rename; who else writes a column; whether an edit forks and what the fork is named; what a fork came from; whether a published column is locked. No WordPress, no HTTP. |
| `includes/tools/class-wpcpm-track-editor.php` | The five handlers: add, save, move, remove a question; delete a track. |
| `includes/tools/class-wpcpm-track-editor-screen.php` | The question list by group with its notices, the add form, the arrows and Remove; the screen one question is edited on; the schema line. |
| `assets/js/track-editor.js` | A row moves in place when its arrow is pressed and the form posts in the background; a refusal puts it back. |
| `bin/test-track-questions.php` | The pure class's suite. |

**Modified**

| File | Why |
| --- | --- |
| `includes/tracks/class-wpcpm-track-columns.php` | `judge()` compares a select's choices; `missing_choices()` names them. |
| `includes/tracks/class-wpcpm-track-publish.php` | The `missing_choices` verdict's message; the preflight refuses a trashed track before reading the base. |
| `includes/class-wpcpm-airtable.php` | `fetch_schema()` fills a fifteen-minute transient; `cached_schema()` reads it. |
| `includes/tracks/class-wpcpm-track-store.php` | `others()`, the sharing index; `ever_published()`; `delete()`. |
| `includes/class-wpcpm-request.php` | `exact()` and `posted_exact()`: a column name is never trimmed. |
| `includes/tools/class-wpcpm-track-builder.php` | Boots the editor; `form()` carries the questions, the index and the schema line; `question_form()` and the route to one question's screen; `rows()` carries `ever_published`; unpublish returns to the publish screen. |
| `includes/tools/class-wpcpm-track-builder-screen.php` | The list under the properties form, read-only for a built-in track; Delete on the track list. |
| `assets/css/track-builder.css` | The editor's rules. |
| `wpcredits-program-manager.php`, `uninstall.php` | The three new class files. |
| `bin/test-track-columns.php`, `bin/test-airtable.php`, `bin/test-track-store.php`, `bin/test-track-publish.php`, `bin/test-request.php`, `bin/test-track-builder.php` | Each holds its class to the new rules. |
| `readme.txt`, `languages/wpcredits-program-manager.pot` | The release. |

---

### Task 1: A track's questions as a list somebody edits

**Files:**
- Create: `includes/tracks/class-wpcpm-track-questions.php`
- Modify: `wpcredits-program-manager.php`, `uninstall.php` (the new class is required in both, beside `class-wpcpm-track-columns.php`)
- Test: `bin/test-track-questions.php`

**Interfaces:**
- Consumes: nothing. The class is pure: a questions map (`column => spec`, in order) in, a map or an answer out. No WordPress function, no HTTP.
- Produces: `WPCPM_Track_Questions::add( array $questions, string $column, array $question ): array|null` (null when the column is already used); `move( array $questions, string $column, string $direction ): array` (`up` or `down`, within the question's group; unchanged at an edge); `remove( array $questions, string $column ): array`; `rename( array $questions, string $from, string $to ): array|null` (null when `$from` is absent or `$to` is another question's); `owners( string $column, array $others ): array[]` (each `label` and `published`, for every entry of `$others` whose `columns` holds the name verbatim); `forks( array $question, array $was ): bool`; `fork_name( string $column, string $key ): string` (`<column> - <key>`); `forked_from( string $column, string $key, array $others ): string` (the stem, or empty); `locked( string $column, array $published ): bool`. Constants `FORKING = array( 'type', 'airtable_type', 'options' )` and `FORK_JOIN = ' - '`. `$others` is a list of `array( 'label' => string, 'published' => bool, 'columns' => string[] )`, the shape Task 4's `WPCPM_Track_Store::others()` produces.

Every rule the editor needs, and nothing that touches WordPress or Airtable, in the shape `WPCPM_Track_Columns` gave T2c: the handlers (Task 5) do the reading and the writing, this class decides. A question is keyed by its Airtable column name, verbatim and never trimmed (the design's 4.2), so nothing here trims one: the checks include a column ending in a space.

Three of the rules are the ones the design's section 5 turns on. `add()` places a question after the last one of its own group rather than at the end of the map, because the form draws group by group. `move()` swaps only with a neighbor in the same group, for the same reason. And `forked_from()` is worked out from the name rather than recorded, so a person who renames a forked column is not left with a stored flag that says something the name no longer does (what this plan decides, 8).

`bin/test-roles.php` walks `includes/` and fails for any class file the loader does not require, which is why the loader and `uninstall.php` are in this task rather than a later one.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-track-questions.php b/bin/test-track-questions.php
new file mode 100644
index 0000000..70880b6
--- /dev/null
+++ b/bin/test-track-questions.php
@@ -0,0 +1,246 @@
+<?php
+/**
+ * A track's questions as a list somebody edits (Track Builder, phase T3a).
+ *
+ * `WPCPM_Track_Questions` holds every rule the question editor needs and touches neither WordPress
+ * nor Airtable, so this suite loads the real class and stands nothing in for it.
+ *
+ * Run from the plugin root:  php bin/test-track-questions.php
+ */
+
+if ( 'cli' !== PHP_SAPI ) {
+	exit( 1 );
+}
+
+define( 'ABSPATH', __DIR__ . '/' );
+
+require_once __DIR__ . '/../includes/tracks/class-wpcpm-track-questions.php';
+
+$fails = 0;
+$total = 0;
+
+function ck( $label, $got, $want ) {
+	global $fails, $total;
+
+	++$total;
+
+	if ( $got === $want ) {
+		printf( "ok   %s\n", $label );
+		return;
+	}
+
+	++$fails;
+	printf( "FAIL %s\n     got:  %s\n     want: %s\n", $label, var_export( $got, true ), var_export( $want, true ) );
+}
+
+/** A track in the shape the definition stores: four questions across three groups. */
+function questions() {
+	return array(
+		'Hours'        => array( 'type' => 'number', 'group' => 'hours', 'label' => 'Hours' ),
+		'Slack name'   => array( 'type' => 'text', 'group' => 'onboarding', 'label' => 'Your Slack name' ),
+		'WP.org name'  => array( 'type' => 'text', 'group' => 'onboarding', 'label' => 'Your WordPress.org name' ),
+		'What you did' => array( 'type' => 'textarea', 'group' => 'project', 'label' => 'What you did' ),
+	);
+}
+
+echo "=== Adding ===\n";
+
+ck( 'a new onboarding question lands after the last onboarding question, not at the end',
+    array_keys( WPCPM_Track_Questions::add( questions(), 'Your blog', array( 'type' => 'url', 'group' => 'onboarding' ) ) ),
+    array( 'Hours', 'Slack name', 'WP.org name', 'Your blog', 'What you did' ) );
+
+ck( 'a question of a group nobody uses yet goes at the end',
+    array_keys( WPCPM_Track_Questions::add( questions(), 'Anything else', array( 'type' => 'textarea', 'group' => 'wrapup' ) ) ),
+    array( 'Hours', 'Slack name', 'WP.org name', 'What you did', 'Anything else' ) );
+
+ck( 'a column another question already uses is refused',
+    WPCPM_Track_Questions::add( questions(), 'Slack name', array( 'type' => 'text', 'group' => 'project' ) ),
+    null );
+
+ck( 'a column name is taken verbatim, trailing space and all',
+    array_keys( WPCPM_Track_Questions::add( questions(), 'Company ', array( 'type' => 'text', 'group' => 'project' ) ) ),
+    array( 'Hours', 'Slack name', 'WP.org name', 'What you did', 'Company ' ) );
+
+echo "\n=== Moving ===\n";
+
+ck( 'up swaps with the question above it in the same group',
+    array_keys( WPCPM_Track_Questions::move( questions(), 'WP.org name', 'up' ) ),
+    array( 'Hours', 'WP.org name', 'Slack name', 'What you did' ) );
+
+ck( 'down swaps the other way',
+    array_keys( WPCPM_Track_Questions::move( questions(), 'Slack name', 'down' ) ),
+    array( 'Hours', 'WP.org name', 'Slack name', 'What you did' ) );
+
+ck( 'the first of its group cannot go up, and nothing else moves either',
+    array_keys( WPCPM_Track_Questions::move( questions(), 'Slack name', 'up' ) ),
+    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );
+
+ck( 'the last of its group cannot go down',
+    array_keys( WPCPM_Track_Questions::move( questions(), 'WP.org name', 'down' ) ),
+    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );
+
+ck( 'the only question of its group cannot move in either direction',
+    array(
+        array_keys( WPCPM_Track_Questions::move( questions(), 'What you did', 'up' ) ),
+        array_keys( WPCPM_Track_Questions::move( questions(), 'What you did', 'down' ) ),
+    ),
+    array(
+        array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ),
+        array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ),
+    ) );
+
+ck( 'a column no question holds moves nothing',
+    array_keys( WPCPM_Track_Questions::move( questions(), 'Nothing', 'up' ) ),
+    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );
+
+ck( 'a move keeps every question whole, not just its order',
+    WPCPM_Track_Questions::move( questions(), 'WP.org name', 'up' )['Slack name'],
+    array( 'type' => 'text', 'group' => 'onboarding', 'label' => 'Your Slack name' ) );
+
+echo "\n=== Removing and renaming ===\n";
+
+ck( 'remove takes one out and leaves the rest in order',
+    array_keys( WPCPM_Track_Questions::remove( questions(), 'Slack name' ) ),
+    array( 'Hours', 'WP.org name', 'What you did' ) );
+
+ck( 'removing a column no question holds changes nothing',
+    array_keys( WPCPM_Track_Questions::remove( questions(), 'Nothing' ) ),
+    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );
+
+ck( 'rename keeps the place the question held',
+    array_keys( WPCPM_Track_Questions::rename( questions(), 'Slack name', 'Slack handle' ) ),
+    array( 'Hours', 'Slack handle', 'WP.org name', 'What you did' ) );
+
+ck( 'and keeps what it held',
+    WPCPM_Track_Questions::rename( questions(), 'Slack name', 'Slack handle' )['Slack handle'],
+    array( 'type' => 'text', 'group' => 'onboarding', 'label' => 'Your Slack name' ) );
+
+ck( 'renaming onto another question is refused rather than overwriting it',
+    WPCPM_Track_Questions::rename( questions(), 'Slack name', 'WP.org name' ),
+    null );
+
+ck( 'renaming a column no question holds is refused',
+    WPCPM_Track_Questions::rename( questions(), 'Nothing', 'Something' ),
+    null );
+
+ck( 'renaming a question to the name it already has is allowed and changes nothing',
+    array_keys( WPCPM_Track_Questions::rename( questions(), 'Slack name', 'Slack name' ) ),
+    array( 'Hours', 'Slack name', 'WP.org name', 'What you did' ) );
+
+echo "\n=== Who else writes this column ===\n";
+
+/** Every other track, as the editor gathers them: two published and one draft. */
+function others() {
+    return array(
+        array( 'label' => '150-hour Track', 'published' => true, 'columns' => array( 'Hours', 'Slack name' ) ),
+        array( 'label' => 'Developer Track', 'published' => true, 'columns' => array( 'Slack name', 'What you did' ) ),
+        array( 'label' => 'Marketing Track', 'published' => false, 'columns' => array( 'Slack name' ) ),
+    );
+}
+
+ck( 'a column three tracks hold names all three, in the order they were given',
+    WPCPM_Track_Questions::owners( 'Slack name', others() ),
+    array(
+        array( 'label' => '150-hour Track', 'published' => true ),
+        array( 'label' => 'Developer Track', 'published' => true ),
+        array( 'label' => 'Marketing Track', 'published' => false ),
+    ) );
+
+ck( 'a draft is named as one, because it does not write the column yet but will',
+    WPCPM_Track_Questions::owners( 'Slack name', others() )[2]['published'],
+    false );
+
+ck( 'a column one track holds names one',
+    WPCPM_Track_Questions::owners( 'Hours', others() ),
+    array( array( 'label' => '150-hour Track', 'published' => true ) ) );
+
+ck( 'a column nobody else holds names nobody',
+    WPCPM_Track_Questions::owners( 'Your blog', others() ),
+    array() );
+
+ck( 'the comparison is exact: a trailing space is a different column',
+    WPCPM_Track_Questions::owners( 'Slack name ', others() ),
+    array() );
+
+echo "\n=== Forking ===\n";
+
+$text = array( 'type' => 'text', 'airtable_type' => 'singleLineText', 'group' => 'onboarding', 'label' => 'Your Slack name' );
+
+ck( 'rewording the label keeps the column',
+    WPCPM_Track_Questions::forks( array_merge( $text, array( 'label' => 'Your Slack name, please' ) ), $text ),
+    false );
+
+ck( 'so does a lead, a subgroup, help and a note',
+    WPCPM_Track_Questions::forks( array_merge( $text, array( 'lead' => 'Before you start', 'subgroup' => 'Accounts', 'help' => 'The one you use in Slack', 'note' => 'Complete one of these.' ) ), $text ),
+    false );
+
+ck( 'changing the control forks',
+    WPCPM_Track_Questions::forks( array_merge( $text, array( 'type' => 'textarea', 'airtable_type' => 'multilineText' ) ), $text ),
+    true );
+
+ck( 'and so does an Airtable type that no longer agrees with the control',
+    WPCPM_Track_Questions::forks( array_merge( $text, array( 'airtable_type' => 'multilineText' ) ), $text ),
+    true );
+
+$select = array( 'type' => 'select', 'airtable_type' => 'singleSelect', 'group' => 'project', 'options' => array( 'Yes', 'No' ) );
+
+ck( 'a new option forks',
+    WPCPM_Track_Questions::forks( array_merge( $select, array( 'options' => array( 'Yes', 'No', 'Maybe' ) ) ), $select ),
+    true );
+
+ck( 'the same options in a different order forks, because Airtable keeps their order',
+    WPCPM_Track_Questions::forks( array_merge( $select, array( 'options' => array( 'No', 'Yes' ) ) ), $select ),
+    true );
+
+ck( 'the same options unchanged do not',
+    WPCPM_Track_Questions::forks( $select, $select ),
+    false );
+
+ck( 'a fork takes the column and the track key',
+    WPCPM_Track_Questions::fork_name( 'Slack name', 'marketing' ),
+    'Slack name - marketing' );
+
+echo "\n=== A fork, afterwards ===\n";
+
+ck( 'a forked column says what it came from while another track still holds that column',
+    WPCPM_Track_Questions::forked_from( 'Slack name - marketing', 'marketing', others() ),
+    'Slack name' );
+
+ck( 'a column of the same shape whose stem nobody holds is not a fork',
+    WPCPM_Track_Questions::forked_from( 'Coffee - marketing', 'marketing', others() ),
+    '' );
+
+ck( 'and neither is a column ending in another track key',
+    WPCPM_Track_Questions::forked_from( 'Slack name - design', 'marketing', others() ),
+    '' );
+
+ck( 'a forked column is shared with nobody, which is what stops it forking a second time',
+    WPCPM_Track_Questions::owners( 'Slack name - marketing', others() ),
+    array() );
+
+ck( 'so putting the control back reports a fork but finds no one to fork away from',
+    array(
+        WPCPM_Track_Questions::forks( $text, array_merge( $text, array( 'type' => 'textarea', 'airtable_type' => 'multilineText' ) ) ),
+        WPCPM_Track_Questions::owners( 'Slack name - marketing', others() ),
+    ),
+    array( true, array() ) );
+
+echo "\n=== A published column is fixed ===\n";
+
+$published = array( 'Hours' => array( 'type' => 'number' ), 'Slack name' => array( 'type' => 'text' ) );
+
+ck( 'a question in the published copy is locked',
+    WPCPM_Track_Questions::locked( 'Slack name', $published ),
+    true );
+
+ck( 'a question added since the last publish is not',
+    WPCPM_Track_Questions::locked( 'Your blog', $published ),
+    false );
+
+ck( 'and a track never published locks nothing',
+    WPCPM_Track_Questions::locked( 'Slack name', array() ),
+    false );
+
+printf( "\n%s (%d checks)\n", $fails ? sprintf( '%d FAILURE(S)', $fails ) : 'ALL PASS', $total );
+
+exit( $fails ? 1 : 0 );
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-track-questions.php`

Expected: `bin/test-track-questions.php` stops with `Fatal error: Uncaught Error: Failed opening required 'includes/tracks/class-wpcpm-track-questions.php'`. The class does not exist yet. (`bin/test-roles.php` still passes at this point: its loader-completeness check flags only files on disk, and the class file arrives with Step 3, which adds the two requires with it.)

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/tracks/class-wpcpm-track-questions.php b/includes/tracks/class-wpcpm-track-questions.php
new file mode 100644
index 0000000..021bdba
--- /dev/null
+++ b/includes/tracks/class-wpcpm-track-questions.php
@@ -0,0 +1,313 @@
+<?php
+/**
+ * A track's questions, as a list somebody edits.
+ *
+ * @package WPCredits_Program_Manager
+ */
+
+defined( 'ABSPATH' ) || exit;
+
+/**
+ * Every rule the question editor needs, and nothing that touches WordPress or Airtable.
+ *
+ * The editor's handlers (`WPCPM_Track_Editor`) do the reading and the writing; this class decides.
+ * Keeping the two apart is what lets the rules below be held by a suite that needs no WordPress at
+ * all, the way `WPCPM_Track_Columns` is held by one that needs no Airtable (the design's section 3).
+ *
+ * A question is keyed by its Airtable column name, verbatim and never trimmed: `key()` hashes the
+ * name and an Airtable name may end in a space (the design's 4.2). Nothing here trims one.
+ */
+final class WPCPM_Track_Questions {
+
+	/**
+	 * The properties whose change gives a shared question a column of its own.
+	 *
+	 * A different type is a different column (the design's 5). `airtable_type` is derived from the
+	 * control rather than typed, so it moves with `type`; it is compared all the same, because a
+	 * question whose stored type disagrees with its control must not pass for unchanged.
+	 *
+	 * @var string[]
+	 */
+	const FORKING = array( 'type', 'airtable_type', 'options' );
+
+	/**
+	 * What separates a forked column from the one it came from.
+	 *
+	 * @var string
+	 */
+	const FORK_JOIN = ' - ';
+
+	/**
+	 * Add a question at the end of its own group.
+	 *
+	 * The form draws group by group, so a question added to Onboarding belongs after the last
+	 * onboarding question rather than at the end of the track, which is where a plain append would
+	 * put it and is not where the person who pressed Add is looking.
+	 *
+	 * @param array  $questions The questions, column => spec, in order.
+	 * @param string $column    The new column name, verbatim.
+	 * @param array  $question  The new question.
+	 * @return array|null The questions with it in place, or null when that column is already used.
+	 */
+	public static function add( array $questions, $column, array $question ) {
+		$column = (string) $column;
+
+		if ( array_key_exists( $column, $questions ) ) {
+			return null;
+		}
+
+		$group = isset( $question['group'] ) ? (string) $question['group'] : '';
+		$after = '';
+
+		foreach ( $questions as $name => $spec ) {
+			if ( is_array( $spec ) && isset( $spec['group'] ) && (string) $spec['group'] === $group ) {
+				$after = (string) $name;
+			}
+		}
+
+		if ( '' === $after ) {
+			$questions[ $column ] = $question;
+
+			return $questions;
+		}
+
+		$placed = array();
+
+		foreach ( $questions as $name => $spec ) {
+			$placed[ $name ] = $spec;
+
+			if ( (string) $name === $after ) {
+				$placed[ $column ] = $question;
+			}
+		}
+
+		return $placed;
+	}
+
+	/**
+	 * Move a question one place up or down among the questions of its own group.
+	 *
+	 * Swapping with whatever happens to sit beside it in the map would move it across a group
+	 * boundary without changing its `group`, which reorders nothing a student sees and looks like
+	 * a button that does not work.
+	 *
+	 * @param array  $questions The questions, column => spec, in order.
+	 * @param string $column    The question to move.
+	 * @param string $direction `up` or `down`.
+	 * @return array The questions in their new order, unchanged when there is nowhere to go.
+	 */
+	public static function move( array $questions, $column, $direction ) {
+		$column = (string) $column;
+
+		if ( ! array_key_exists( $column, $questions ) ) {
+			return $questions;
+		}
+
+		$spec  = $questions[ $column ];
+		$group = is_array( $spec ) && isset( $spec['group'] ) ? (string) $spec['group'] : '';
+		$peers = array();
+
+		foreach ( $questions as $name => $other ) {
+			if ( is_array( $other ) && isset( $other['group'] ) && (string) $other['group'] === $group ) {
+				$peers[] = (string) $name;
+			}
+		}
+
+		$at   = array_search( $column, $peers, true );
+		$with = 'up' === $direction ? $at - 1 : $at + 1;
+
+		if ( false === $at || ! isset( $peers[ $with ] ) ) {
+			return $questions;
+		}
+
+		return self::swap( $questions, $column, $peers[ $with ] );
+	}
+
+	/**
+	 * Two questions in each other's place, every other question where it was.
+	 *
+	 * @param array  $questions The questions.
+	 * @param string $one       One column.
+	 * @param string $other     The other.
+	 * @return array
+	 */
+	private static function swap( array $questions, $one, $other ) {
+		$swapped = array();
+
+		foreach ( $questions as $name => $spec ) {
+			if ( (string) $name === $one ) {
+				$swapped[ $other ] = $questions[ $other ];
+				continue;
+			}
+
+			if ( (string) $name === $other ) {
+				$swapped[ $one ] = $questions[ $one ];
+				continue;
+			}
+
+			$swapped[ $name ] = $spec;
+		}
+
+		return $swapped;
+	}
+
+	/**
+	 * Take a question out.
+	 *
+	 * What it leaves in Airtable is not this class's business: the column and every answer in it
+	 * stay, because nothing is deleted (the design's decision 9), and the screen says so.
+	 *
+	 * @param array  $questions The questions.
+	 * @param string $column    The question to remove.
+	 * @return array The questions without it.
+	 */
+	public static function remove( array $questions, $column ) {
+		unset( $questions[ (string) $column ] );
+
+		return $questions;
+	}
+
+	/**
+	 * Give a question a different column, in the place it already holds.
+	 *
+	 * @param array  $questions The questions.
+	 * @param string $from      The column it has.
+	 * @param string $to        The column it should have, verbatim.
+	 * @return array|null The questions, or null when there is nothing to rename or the new name
+	 *                    belongs to another question.
+	 */
+	public static function rename( array $questions, $from, $to ) {
+		$from = (string) $from;
+		$to   = (string) $to;
+
+		if ( ! array_key_exists( $from, $questions ) ) {
+			return null;
+		}
+
+		if ( $from === $to ) {
+			return $questions;
+		}
+
+		if ( array_key_exists( $to, $questions ) ) {
+			return null;
+		}
+
+		$renamed = array();
+
+		foreach ( $questions as $name => $spec ) {
+			$renamed[ (string) $name === $from ? $to : $name ] = $spec;
+		}
+
+		return $renamed;
+	}
+
+	/**
+	 * Which other tracks write this column.
+	 *
+	 * @param string $column The column.
+	 * @param array  $others Each `label`, `published` and `columns`: every track but this one.
+	 * @return array[] Those that hold it, in the order given, each `label` and `published`.
+	 */
+	public static function owners( $column, array $others ) {
+		$column = (string) $column;
+		$found  = array();
+
+		foreach ( $others as $other ) {
+			if ( ! is_array( $other ) || empty( $other['columns'] ) || ! is_array( $other['columns'] ) ) {
+				continue;
+			}
+
+			if ( ! in_array( $column, array_map( 'strval', $other['columns'] ), true ) ) {
+				continue;
+			}
+
+			$found[] = array(
+				'label'     => isset( $other['label'] ) ? (string) $other['label'] : '',
+				'published' => ! empty( $other['published'] ),
+			);
+		}
+
+		return $found;
+	}
+
+	/**
+	 * Whether this edit gives the question a column of its own.
+	 *
+	 * Rewording keeps the column and warns; changing the control, the Airtable type or a select's
+	 * options is a different column (the design's 5).
+	 *
+	 * @param array $question The question as it would be saved.
+	 * @param array $was      The question as it is stored.
+	 * @return bool
+	 */
+	public static function forks( array $question, array $was ) {
+		foreach ( self::FORKING as $property ) {
+			$now = isset( $question[ $property ] ) ? $question[ $property ] : null;
+			$old = isset( $was[ $property ] ) ? $was[ $property ] : null;
+
+			if ( is_array( $now ) || is_array( $old ) ) {
+				if ( array_map( 'strval', (array) $now ) !== array_map( 'strval', (array) $old ) ) {
+					return true;
+				}
+
+				continue;
+			}
+
+			if ( (string) $now !== (string) $old ) {
+				return true;
+			}
+		}
+
+		return false;
+	}
+
+	/**
+	 * The column a forked question takes.
+	 *
+	 * @param string $column The column it shared.
+	 * @param string $key    The track's key.
+	 * @return string
+	 */
+	public static function fork_name( $column, $key ) {
+		return (string) $column . self::FORK_JOIN . (string) $key;
+	}
+
+	/**
+	 * The column a forked question came from, when it reads as a fork of one another track holds.
+	 *
+	 * Worked out rather than recorded, so a person who renames a forked column is not left with a
+	 * stored flag that says something the name no longer does.
+	 *
+	 * @param string $column The column this question holds.
+	 * @param string $key    The track's key.
+	 * @param array  $others As `owners()` takes them.
+	 * @return string The column it forked from, or an empty string when it did not.
+	 */
+	public static function forked_from( $column, $key, array $others ) {
+		$column = (string) $column;
+		$tail   = self::FORK_JOIN . (string) $key;
+		$cut    = strlen( $column ) - strlen( $tail );
+
+		if ( '' === (string) $key || $cut < 1 || substr( $column, $cut ) !== $tail ) {
+			return '';
+		}
+
+		$from = substr( $column, 0, $cut );
+
+		return array() === self::owners( $from, $others ) ? '' : $from;
+	}
+
+	/**
+	 * Whether a question's column is fixed because it has been published.
+	 *
+	 * Renaming it would leave the old column holding every student's answer while the form began
+	 * writing to a new one, and nothing is deleted (the design's decisions 9 and 23).
+	 *
+	 * @param string $column    The column.
+	 * @param array  $published The published copy's questions, column => spec.
+	 * @return bool
+	 */
+	public static function locked( $column, array $published ) {
+		return array_key_exists( (string) $column, $published );
+	}
+}
diff --git a/uninstall.php b/uninstall.php
index 030b463..4d9b118 100644
--- a/uninstall.php
+++ b/uninstall.php
@@ -53,6 +53,7 @@ require_once plugin_dir_path( __FILE__ ) . 'includes/class-wpcpm-form-guard.php'
 require_once plugin_dir_path( __FILE__ ) . 'includes/class-wpcpm-form-stash.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tracks/class-wpcpm-track-palette.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tracks/class-wpcpm-track-columns.php';
+require_once plugin_dir_path( __FILE__ ) . 'includes/tracks/class-wpcpm-track-questions.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tracks/class-wpcpm-track-publish.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tracks/class-wpcpm-track-definition.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tracks/class-wpcpm-tracks.php';
diff --git a/wpcredits-program-manager.php b/wpcredits-program-manager.php
index 7eac715..1ef6603 100644
--- a/wpcredits-program-manager.php
+++ b/wpcredits-program-manager.php
@@ -45,6 +45,7 @@ require_once WPCPM_PLUGIN_DIR . 'includes/class-wpcpm-contribution-teams.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/class-wpcpm-field-value.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tracks/class-wpcpm-track-palette.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tracks/class-wpcpm-track-columns.php';
+require_once WPCPM_PLUGIN_DIR . 'includes/tracks/class-wpcpm-track-questions.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tracks/class-wpcpm-track-publish.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tracks/class-wpcpm-track-definition.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tracks/class-wpcpm-tracks.php';
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-track-questions.php`

Expected: `bin/test-track-questions.php` ends `ALL PASS (39 checks)`. `php bin/test-roles.php` ends `ALL PASS` as well.

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-track-questions.php includes/tracks/class-wpcpm-track-questions.php wpcredits-program-manager.php uninstall.php
git commit -m "Track Builder T3a: the questions of a track as a list somebody edits"
```

---

### Task 2: A single select must offer every choice the question does

**Files:**
- Modify: `includes/tracks/class-wpcpm-track-columns.php` (`judge()` and a new `missing_choices()`)
- Modify: `includes/tracks/class-wpcpm-track-publish.php` (the new verdict's message, and the docblock listing the verdicts)
- Test: `bin/test-track-columns.php`, `bin/test-track-publish.php`

**Interfaces:**
- Consumes: `WPCPM_Track_Columns::judge( $column, array $question, array $columns )` and the preflight's `column_message()` as T2c left them.
- Produces: `judge()` answers `missing_choices` for a `select` whose column exists as a `singleSelect` that lacks any of the question's options (type checked first, so a select against a column of another type is still `type_mismatch`); `WPCPM_Track_Columns::missing_choices( $column, array $question, array $columns ): string[]`, the absent options in the question's order; the preflight refuses with code `column_missing_choices` and a message that lists them and says Airtable's API cannot add a choice.

Decision 26. `judge()` compared a column's type and never its choices, which was sound while questions arrived only by duplication and their options came with their column. From Task 5 on, a question can be pointed at any column that already exists, and a select whose column lacks a choice would pass the preflight and fail on the student's save. Airtable's update-field endpoint cannot add a choice to a single select (open item 1, settled 12 September 2026), so this is a refusal for a person to act on, and the list of absent choices is what they act on.

The comparison is exact: a choice differing only in case is missing, because Airtable would refuse the write. The publish suite holds the refusal end to end, in the preflight's own words, and then shows the same column ready once the base offers every choice.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-track-columns.php b/bin/test-track-columns.php
index 61a9e28..0d0d74e 100644
--- a/bin/test-track-columns.php
+++ b/bin/test-track-columns.php
@@ -184,6 +184,51 @@ ck( 'the four computed columns of the real table are named as computed',
 ck( 'and its five other link columns are refused while Main Contribution Team is not among them',
     $foreign, array( 'Company ', 'Educational institution', 'Lessons', 'Mentor', 'Students' ) );
 
+echo "\n=== A single select must offer every choice the question does ===\n";
+
+/** One single select in the base, offering two of the three answers a question might want. */
+$choices = array(
+    'Course finished' => array(
+        'type'    => 'singleSelect',
+        'options' => array( 'choices' => array( array( 'name' => 'Yes' ), array( 'name' => 'No' ) ) ),
+    ),
+);
+
+ck( 'a select whose options the column all offers is ready',
+    WPCPM_Track_Columns::judge( 'Course finished', array( 'type' => 'select', 'options' => array( 'Yes', 'No' ) ), $choices ),
+    'ok' );
+
+ck( 'a select wanting one choice the column does not offer is refused',
+    WPCPM_Track_Columns::judge( 'Course finished', array( 'type' => 'select', 'options' => array( 'Yes', 'No', 'Not yet' ) ), $choices ),
+    'missing_choices' );
+
+ck( 'and the refusal can name it',
+    WPCPM_Track_Columns::missing_choices( 'Course finished', array( 'type' => 'select', 'options' => array( 'Yes', 'No', 'Not yet' ) ), $choices ),
+    array( 'Not yet' ) );
+
+ck( 'several missing choices are all named, in the order the question lists them',
+    WPCPM_Track_Columns::missing_choices( 'Course finished', array( 'type' => 'select', 'options' => array( 'Withdrew', 'Yes', 'Not yet' ) ), $choices ),
+    array( 'Withdrew', 'Not yet' ) );
+
+ck( 'the comparison is exact, so a choice differing only in case is missing',
+    WPCPM_Track_Columns::judge( 'Course finished', array( 'type' => 'select', 'options' => array( 'yes' ) ), $choices ),
+    'missing_choices' );
+
+ck( 'a select against a column that is not one is still a type mismatch, not a missing choice',
+    WPCPM_Track_Columns::judge( 'What you did', array( 'type' => 'select', 'options' => array( 'Yes' ) ), $columns ),
+    'type_mismatch' );
+
+ck( 'a select whose column is not in the base at all is created, choices and all',
+    array(
+        WPCPM_Track_Columns::judge( 'Brand new', array( 'type' => 'select', 'options' => array( 'Yes' ) ), $columns ),
+        WPCPM_Track_Columns::field( 'Brand new', array( 'type' => 'select', 'options' => array( 'Yes' ) ) ),
+    ),
+    array( 'create', array( 'name' => 'Brand new', 'type' => 'singleSelect', 'options' => array( 'choices' => array( array( 'name' => 'Yes' ) ) ) ) ) );
+
+ck( 'a control that is not a select never asks about choices',
+    WPCPM_Track_Columns::judge( 'Course finished', array( 'type' => 'text' ), $choices ),
+    'type_mismatch' );
+
 printf( "\n%s (%d checks)\n", $fails ? sprintf( '%d FAILURE(S)', $fails ) : 'ALL PASS', $total );
 
 exit( $fails ? 1 : 0 );
diff --git a/bin/test-track-publish.php b/bin/test-track-publish.php
index 21019d5..6c2ca0a 100644
--- a/bin/test-track-publish.php
+++ b/bin/test-track-publish.php
@@ -266,6 +266,27 @@ WPCPM_Airtable::$schema    = base( array( 'What you did' => 'formula' ), array(
 ck( 'a computed column is refused: a student\'s answer sent to one is thrown away',
     codes( WPCPM_Track_Publish::preflight( 7 )['refusals'] ), array( 'column_computed' ) );
 
+// A single select already in the base must offer every choice the question does: Airtable's API
+// cannot add one (decision 26), so the refusal names the absent choices for somebody to add.
+WPCPM_Airtable::$schema = base( array( 'What you did' => 'multilineText' ), array( 'Marketing Track' ) );
+WPCPM_Airtable::$schema['tblReports']['columns']['Tool used'] = array( 'type' => 'singleSelect', 'options' => array( 'choices' => array( array( 'name' => 'MAAMP' ) ) ) );
+WPCPM_Track_Store::$definitions[7]['questions']['Tool used'] = array( 'label' => 'The tool you used', 'type' => 'select', 'group' => 'project', 'options' => array( 'MAAMP', 'Local', 'Studio' ) );
+
+$choices_flight = WPCPM_Track_Publish::preflight( 7 );
+
+ck( 'a select whose column lacks some of its choices is refused, and the refusal names them in the question\'s order',
+    array( codes( $choices_flight['refusals'] ), $choices_flight['refusals'][0]['column'], false !== strpos( $choices_flight['refusals'][0]['message'], 'Local, Studio' ), false !== strpos( $choices_flight['refusals'][0]['message'], 'cannot add a choice' ) ),
+    array( array( 'column_missing_choices' ), 'Tool used', true, true ) );
+
+WPCPM_Airtable::$schema['tblReports']['columns']['Tool used']['options']['choices'][] = array( 'name' => 'Local' );
+WPCPM_Airtable::$schema['tblReports']['columns']['Tool used']['options']['choices'][] = array( 'name' => 'Studio' );
+
+ck( 'and once the base offers them all, the column is ready',
+    array( codes( WPCPM_Track_Publish::preflight( 7 )['refusals'] ), in_array( 'Tool used', WPCPM_Track_Publish::preflight( 7 )['columns']['ready'], true ) ),
+    array( array(), true ) );
+
+unset( WPCPM_Track_Store::$definitions[7]['questions']['Tool used'] );
+
 WPCPM_Airtable::$schema = base( array( 'What you did' => 'multipleRecordLinks' ), array( 'Marketing Track' ) );
 
 ck( 'so is a link column that is not Main Contribution Team, which would reach into another table',
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-track-columns.php` and `php bin/test-track-publish.php`

Expected: `bin/test-track-columns.php` stops with `FAIL a select wanting one choice the column does not offer is refused`; `bin/test-track-publish.php` stops with `FAIL a select whose column lacks some of its choices is refused, and the refusal names them in the question's order`. `judge()` still answers `ok` where `missing_choices` is wanted, and `missing_choices()` does not exist yet.

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/tracks/class-wpcpm-track-columns.php b/includes/tracks/class-wpcpm-track-columns.php
index 57642bf..f21ae0b 100644
--- a/includes/tracks/class-wpcpm-track-columns.php
+++ b/includes/tracks/class-wpcpm-track-columns.php
@@ -146,7 +146,54 @@ final class WPCPM_Track_Columns {
 			return 'ok';
 		}
 
-		return self::TYPES[ $wanted ] === $type ? 'ok' : 'type_mismatch';
+		if ( self::TYPES[ $wanted ] !== $type ) {
+			return 'type_mismatch';
+		}
+
+		// A single select that already exists must offer every choice the question does. Airtable's
+		// update-field endpoint cannot add one, and the record write that could needs `typecast`,
+		// which 2.5 forbids (open item 1, settled 12 September 2026), so a missing choice is not
+		// something publishing can put right: the preflight refuses and a person adds it.
+		if ( 'select' === $wanted && array() !== self::missing_choices( $column, $question, $columns ) ) {
+			return 'missing_choices';
+		}
+
+		return 'ok';
+	}
+
+	/**
+	 * The options a select question has that the column in the base does not offer.
+	 *
+	 * Answered here rather than inside `judge()` so the refusal can name them: "a choice is
+	 * missing" is a message somebody has to go and investigate, and the list is the investigation.
+	 *
+	 * @param string $column   The column name.
+	 * @param array  $question The question.
+	 * @param array  $columns  The table's columns, as `WPCPM_Airtable::fetch_schema()` reports them.
+	 * @return string[] The absent options, in the order the question lists them.
+	 */
+	public static function missing_choices( $column, array $question, array $columns ) {
+		$choices = isset( $columns[ (string) $column ]['options']['choices'] )
+			? (array) $columns[ (string) $column ]['options']['choices']
+			: array();
+
+		$names = array();
+
+		foreach ( $choices as $choice ) {
+			if ( isset( $choice['name'] ) ) {
+				$names[] = (string) $choice['name'];
+			}
+		}
+
+		$missing = array();
+
+		foreach ( isset( $question['options'] ) ? (array) $question['options'] : array() as $option ) {
+			if ( ! in_array( (string) $option, $names, true ) ) {
+				$missing[] = (string) $option;
+			}
+		}
+
+		return $missing;
 	}
 
 	/**
diff --git a/includes/tracks/class-wpcpm-track-publish.php b/includes/tracks/class-wpcpm-track-publish.php
index 59d7ae5..c39b559 100644
--- a/includes/tracks/class-wpcpm-track-publish.php
+++ b/includes/tracks/class-wpcpm-track-publish.php
@@ -205,7 +205,11 @@ final class WPCPM_Track_Publish {
 				continue;
 			}
 
-			$refusals[] = self::finding( 'column_' . $verdict, $column, self::column_message( $verdict ) );
+			$missing = 'missing_choices' === $verdict
+				? WPCPM_Track_Columns::missing_choices( $column, isset( $definition['questions'][ $column ] ) ? (array) $definition['questions'][ $column ] : array(), $columns )
+				: array();
+
+			$refusals[] = self::finding( 'column_' . $verdict, $column, self::column_message( $verdict, $missing ) );
 		}
 
 		$now   = count( $columns );
@@ -695,7 +699,8 @@ final class WPCPM_Track_Publish {
 	 *
 	 * @param array $definition The track definition.
 	 * @param array $columns    The base table's columns, from the schema.
-	 * @return array Map of column names to verdict strings: `ok`, `create`, `computed`, `type_mismatch`, `foreign_link`.
+	 * @return array Map of column names to verdict strings: `ok`, `create`, `computed`, `type_mismatch`,
+	 *               `missing_choices`, `foreign_link`.
 	 */
 	private static function judge_columns( array $definition, array $columns ) {
 		$verdicts = array();
@@ -824,10 +829,11 @@ final class WPCPM_Track_Publish {
 	/**
 	 * Why a column already in the base cannot be used.
 	 *
-	 * @param string $verdict What `WPCPM_Track_Columns::judge()` said.
+	 * @param string   $verdict What `WPCPM_Track_Columns::judge()` said.
+	 * @param string[] $missing The options a single select does not offer, for that verdict alone.
 	 * @return string
 	 */
-	private static function column_message( $verdict ) {
+	private static function column_message( $verdict, array $missing = array() ) {
 		if ( 'computed' === $verdict ) {
 			return __( 'Airtable works this column out for itself, so nothing can be written to it: a student\'s answer would be thrown away.', 'wpcredits-program-manager' );
 		}
@@ -836,6 +842,14 @@ final class WPCPM_Track_Publish {
 			return __( 'This column links to another table, and a link carries a reverse column into it. Main Contribution Team is the one link a question may use.', 'wpcredits-program-manager' );
 		}
 
+		if ( 'missing_choices' === $verdict ) {
+			return sprintf(
+				/* translators: %s: a comma-separated list of the choices the Airtable column does not offer. */
+				__( 'The column in the base does not offer every choice this question does, and a student picking one of the missing ones would not save: %s. Airtable cannot add a choice through its API, so somebody adds them in the base and publishes again.', 'wpcredits-program-manager' ),
+				implode( ', ', $missing )
+			);
+		}
+
 		return __( 'The column in the base is a different type from the one this question needs, so the answer would arrive in the wrong shape.', 'wpcredits-program-manager' );
 	}
 
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-track-columns.php` and `php bin/test-track-publish.php`

Expected: `bin/test-track-columns.php` ends `ALL PASS (34 checks)` and `bin/test-track-publish.php` ends `ALL PASS (83 checks)`. 

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-track-columns.php bin/test-track-publish.php includes/tracks/class-wpcpm-track-columns.php includes/tracks/class-wpcpm-track-publish.php
git commit -m "Track Builder T3a: a single select must offer every choice the question does"
```

---

### Task 3: The last schema read is kept for the track editor

**Files:**
- Modify: `includes/class-wpcpm-airtable.php`
- Test: `bin/test-airtable.php`

**Interfaces:**
- Consumes: `fetch_schema()` as it is, and WordPress's `set_transient()` / `get_transient()`, which the suite stands in.
- Produces: `WPCPM_Airtable::SCHEMA_TRANSIENT` (`wpcpm_airtable_schema`) and `SCHEMA_TTL` (900); `fetch_schema()` writes the transient as `array( 'read' => time(), 'schema' => ... )` on every successful read and leaves it alone on a failure; `cached_schema(): array|WP_Error` answering `array( 'schema' => ..., 'age' => seconds )` from the transient, or from a fresh read at age 0, or the fresh read's error when nothing is held.

Decision 24. The line at the top of the editor comes from the same diff the preflight computes, and the preflight reads the base over HTTPS; drawing it live would put an Airtable round trip in front of every editor page. So every successful schema read now fills a fifteen-minute transient - the preflight, the run's re-read and the mentors sync all keep it current without being asked - and only the editor's line (Task 9) calls `cached_schema()`. The preflight keeps calling `fetch_schema()`: the number that decides what gets created in Airtable is never a cached one.

The two constants go below `PAGE_SIZE`, each with its own docblock: `API_BASE` and `PAGE_SIZE` are an aligned pair, and a constant put between them re-aligns neither and trips the standards gate.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-airtable.php b/bin/test-airtable.php
index d7dc78e..1746840 100644
--- a/bin/test-airtable.php
+++ b/bin/test-airtable.php
@@ -50,6 +50,8 @@ function add_query_arg( $args, $url ) { return $url . ( false === strpos( $url,
 function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['opts'] ) ? $GLOBALS['opts'][ $k ] : $d; }
 function update_option( $k, $v, $a = null ) { $GLOBALS['opts'][ $k ] = $v; return true; }
 function delete_option( $k ) { unset( $GLOBALS['opts'][ $k ] ); return true; }
+function get_transient( $k ) { return array_key_exists( $k, $GLOBALS['transients'] ) ? $GLOBALS['transients'][ $k ] : false; }
+function set_transient( $k, $v, $ttl = 0 ) { $GLOBALS['transients'][ $k ] = $v; $GLOBALS['ttl'][ $k ] = $ttl; return true; }
 function wp_doing_cron() { return ! empty( $GLOBALS['doing_cron'] ); }
 
 /**
@@ -118,6 +120,8 @@ function fresh( $mode = 'web' ) {
 	$GLOBALS['mode']  = $mode;
 	$GLOBALS['now']   = 1700000000.0;
 	$GLOBALS['opts']  = array();
+	$GLOBALS['transients'] = array();
+	$GLOBALS['ttl']   = array();
 	$GLOBALS['queue'] = array();
 	$GLOBALS['sent']  = array();
 	$GLOBALS['slept'] = array();
@@ -646,6 +650,46 @@ ck( 'and the types arrive beside them, with a select carrying its choices',
 		'Tool used' => array( 'type' => 'singleSelect', 'options' => array( 'choices' => array( array( 'name' => 'MAAMP' ) ) ) ),
 	) );
 
+echo "\n=== The last schema read is kept for the track editor ===\n";
+
+// The read above filled the transient: the copy is the schema, held for fifteen minutes.
+ck( 'a successful read is kept, schema and all, for fifteen minutes',
+	array( $GLOBALS['transients'][ WPCPM_Airtable::SCHEMA_TRANSIENT ]['schema'] === $schema, $GLOBALS['ttl'][ WPCPM_Airtable::SCHEMA_TRANSIENT ] ),
+	array( true, 900 ) );
+
+$held = $airtable->cached_schema();
+
+ck( 'the editor reads the held copy and no request is made',
+	array( $held['schema'] === $schema, $held['age'] < 5, sent() ),
+	array( true, true, 1 ) );
+
+$GLOBALS['transients'][ WPCPM_Airtable::SCHEMA_TRANSIENT ]['read'] = time() - 300;
+
+ck( 'and says how old it is',
+	$airtable->cached_schema()['age'] >= 300, true );
+
+$GLOBALS['transients'] = array();
+queue( response( 200, array( 'tables' => array( array( 'id' => 'tblY', 'name' => 'Other', 'fields' => array() ) ) ) ) );
+$fresh_read = $airtable->cached_schema();
+
+ck( 'with nothing held it reads the base, and that read is age zero',
+	array( array_keys( $fresh_read['schema'] ), $fresh_read['age'], sent() ),
+	array( array( 'tblY' ), 0, 2 ) );
+
+$GLOBALS['transients'] = array();
+queue( response( 500, array( 'error' => 'boom' ) ) );
+
+ck( 'with nothing held and the base unreadable, the error comes back and nothing is kept',
+	array( is_wp_error( $airtable->cached_schema() ), $GLOBALS['transients'] ),
+	array( true, array() ) );
+
+fresh( 'web' );
+queue( response( 500, array( 'error' => 'boom' ) ) );
+$airtable->fetch_schema();
+
+ck( 'a failed read leaves the held copy alone',
+	$GLOBALS['transients'], array() );
+
 echo "\n" . ( $fail ? "$fail FAILURE(S)\n" : "ALL PASS\n" );
 
 exit( $fail ? 1 : 0 );
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-airtable.php`

Expected: `bin/test-airtable.php` stops with `Fatal error: Uncaught Error: Undefined constant WPCPM_Airtable::SCHEMA_TRANSIENT`. The constant does not exist yet.

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/class-wpcpm-airtable.php b/includes/class-wpcpm-airtable.php
index 8302f2d..4761937 100644
--- a/includes/class-wpcpm-airtable.php
+++ b/includes/class-wpcpm-airtable.php
@@ -31,6 +31,20 @@ class WPCPM_Airtable {
 	const API_BASE  = 'https://api.airtable.com/v0';
 	const PAGE_SIZE = 100;
 
+	/**
+	 * Where the last schema read is kept for the track editor's line.
+	 *
+	 * @var string
+	 */
+	const SCHEMA_TRANSIENT = 'wpcpm_airtable_schema';
+
+	/**
+	 * How long that copy serves before the editor reads the base again: fifteen minutes.
+	 *
+	 * @var int
+	 */
+	const SCHEMA_TTL = 900;
+
 	/**
 	 * The shape of an Airtable record ID: `rec` and fourteen alphanumerics.
 	 *
@@ -463,9 +477,55 @@ class WPCPM_Airtable {
 			);
 		}
 
+		// Every successful read refills the copy the editor draws from, so the preflight, the
+		// run's re-read and the mentors sync keep it current without being asked to (the
+		// design's decision 24). Nothing reads it back but `cached_schema()`.
+		set_transient(
+			self::SCHEMA_TRANSIENT,
+			array(
+				'read'   => time(),
+				'schema' => $schema,
+			),
+			self::SCHEMA_TTL
+		);
+
 		return $schema;
 	}
 
+	/**
+	 * The schema as it was last read, when that was recent, or a fresh read.
+	 *
+	 * For the line at the top of the track editor and nothing else: a screen somebody opens many
+	 * times an hour cannot wait on Airtable each time, and the number it shows is advice. The
+	 * publish screen's preflight keeps calling `fetch_schema()`, because the number that decides
+	 * what gets created in the base is never a cached one (the design's decision 24).
+	 *
+	 * @return array|WP_Error `schema` as `fetch_schema()` returns it and `age` in seconds, 0 for
+	 *                        a read made now; or the error a fresh read failed with when nothing
+	 *                        recent is held.
+	 */
+	public function cached_schema() {
+		$held = get_transient( self::SCHEMA_TRANSIENT );
+
+		if ( is_array( $held ) && isset( $held['read'], $held['schema'] ) && is_array( $held['schema'] ) ) {
+			return array(
+				'schema' => $held['schema'],
+				'age'    => max( 0, time() - (int) $held['read'] ),
+			);
+		}
+
+		$schema = $this->fetch_schema();
+
+		if ( is_wp_error( $schema ) ) {
+			return $schema;
+		}
+
+		return array(
+			'schema' => $schema,
+			'age'    => 0,
+		);
+	}
+
 	/**
 	 * Create one column on a table.
 	 *
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-airtable.php`

Expected: `bin/test-airtable.php` ends `ALL PASS`. 

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-airtable.php includes/class-wpcpm-airtable.php
git commit -m "Track Builder T3a: the last schema read is kept for the track editor"
```

---

### Task 4: The store names every other track's columns, and deletes a track never published

**Files:**
- Modify: `includes/tracks/class-wpcpm-track-store.php`
- Test: `bin/test-track-store.php`

**Interfaces:**
- Consumes: `all_ids()`, `get()`, `state()`, `source()`, `log_entries()`, `track_post()` and `WPCPM_Tracks::OPT_FIELDS_PREFIX`, all as T2c left them.
- Produces: `WPCPM_Track_Store::others( $post_id ): array[]`, every track but the one asking, oldest first, each `label`, `published` (true for a published or changed track and for a built-in one still running from its PHP) and `columns` (the question keys, verbatim); `ever_published( $post_id ): bool`, from a `publish` entry in the log; `delete( $post_id ): int|WP_Error` with codes `wpcpm_track_missing`, `wpcpm_track_builtin`, `wpcpm_track_was_published` and `wpcpm_track_not_deleted`, deleting the post for good and the form option its key would have had.

Two things the editor asks of the store. The sharing index is the design's section 5: a column is shared when another track holds the same name, verbatim, whatever side of the switch that track is on, and a draft is named too, marked as one, because it does not write the column yet but will. Delete is decision 25: a track that was never published created no column, holds no student's status and was never compiled, so nothing else has to change, and `compile()` reads published posts only. The log is the record rather than the post status, because unpublishing sets the status back to draft and the log survives it.

The three methods go before `all_ids()`, which is what they read.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-track-store.php b/bin/test-track-store.php
index a33f884..dffae6b 100644
--- a/bin/test-track-store.php
+++ b/bin/test-track-store.php
@@ -780,6 +780,70 @@ ck( 'but it still has the required fields',
     array( true, true, true ) );
 
 
+echo "\n=== Every other track, for the question editor's sharing index ===\n";
+
+$GLOBALS['posts'] = array();
+$GLOBALS['pmeta'] = array();
+$GLOBALS['opts']  = array();
+
+$shared_a = WPCPM_Track_Store::create( track( 'Sharing A', 'share-a' ) );
+$shared_b = WPCPM_Track_Store::create( track( 'Sharing B', 'share-b' ) );
+$shared_c = WPCPM_Track_Store::create( track( 'Sharing C', 'share-c' ) );
+WPCPM_Track_Store::publish( $shared_b );
+update_post_meta( $shared_c, WPCPM_Track_Store::META_SOURCE, 'builtin' );
+
+$others = WPCPM_Track_Store::others( $shared_a );
+
+ck( 'every track but the one asking, oldest first, with its label and its columns',
+    array_map( function ( $o ) { return array( $o['label'], $o['columns'] ); }, $others ),
+    array(
+        array( 'Sharing B', array( 'Hours', 'share-b notes' ) ),
+        array( 'Sharing C', array( 'Hours', 'share-c notes' ) ),
+    ) );
+
+ck( 'a published track and a built-in one both write their columns; a draft does not yet',
+    array( array_column( $others, 'published' ), array_column( WPCPM_Track_Store::others( $shared_b ), 'published' ) ),
+    array( array( true, true ), array( false, true ) ) );
+
+ck( 'a column name travels verbatim, so a trailing space is kept',
+    WPCPM_Track_Store::others( $shared_b )[0]['columns'][0], 'Hours' );
+
+echo "\n=== A track that was never published can be deleted ===\n";
+
+ck( 'a draft that has never been published has no publish in its log',
+    WPCPM_Track_Store::ever_published( $shared_a ), false );
+
+ck( 'a published track has',
+    WPCPM_Track_Store::ever_published( $shared_b ), true );
+
+WPCPM_Track_Store::unpublish( $shared_b );
+
+ck( 'and unpublishing does not take that back: the log is the record',
+    array( WPCPM_Track_Store::state( $shared_b ), WPCPM_Track_Store::ever_published( $shared_b ) ),
+    array( 'draft', true ) );
+
+$refused = WPCPM_Track_Store::delete( $shared_b );
+
+ck( 'so a track that was ever published is refused, and kept',
+    array( $refused->get_error_code(), null !== get_post( $shared_b ) ),
+    array( 'wpcpm_track_was_published', true ) );
+
+ck( 'a built-in track is refused as well',
+    WPCPM_Track_Store::delete( $shared_c )->get_error_code(), 'wpcpm_track_builtin' );
+
+ck( 'a track that does not exist is refused',
+    WPCPM_Track_Store::delete( 987654 )->get_error_code(), 'wpcpm_track_missing' );
+
+$GLOBALS['opts'][ WPCPM_Tracks::OPT_FIELDS_PREFIX . 'share-a' ] = array( 'left by a compile that never finished' );
+
+ck( 'a never-published draft is deleted, its post and its stray form option with it',
+    array( WPCPM_Track_Store::delete( $shared_a ), get_post( $shared_a ), array_key_exists( WPCPM_Tracks::OPT_FIELDS_PREFIX . 'share-a', $GLOBALS['opts'] ) ),
+    array( $shared_a, null, false ) );
+
+ck( 'and the other tracks are untouched',
+    array( null !== get_post( $shared_b ), null !== get_post( $shared_c ) ), array( true, true ) );
+
+
 printf( "\n%s (%d checks)\n", $fails ? sprintf( '%d FAILED', $fails ) : 'ALL PASS', $total );
 
 exit( $fails ? 1 : 0 );
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-track-store.php`

Expected: `bin/test-track-store.php` stops with `Fatal error: Uncaught Error: Call to undefined method WPCPM_Track_Store::others()`. The method does not exist yet.

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/tracks/class-wpcpm-track-store.php b/includes/tracks/class-wpcpm-track-store.php
index 9bd9442..123a8e7 100644
--- a/includes/tracks/class-wpcpm-track-store.php
+++ b/includes/tracks/class-wpcpm-track-store.php
@@ -1070,6 +1070,105 @@ final class WPCPM_Track_Store {
 		return new WP_Error( 'wpcpm_track_not_equivalent', __( 'The definition is not identical to the track as its PHP runs it, so switching would change what students see.', 'wpcredits-program-manager' ), array( 'differences' => $differences ) );
 	}
 
+	/**
+	 * Every other track, as the question editor's sharing index takes them.
+	 *
+	 * A column is shared when another track holds the same name, verbatim, whatever side of the
+	 * switch that track is on: a built-in track's definition is its PHP's output, so its columns
+	 * are the ones its form writes (the design's 5). A draft that was never published is named
+	 * too, marked as one, because it does not write the column yet but will.
+	 *
+	 * @param int $post_id The track whose editor is asking, left out of the answer.
+	 * @return array[] Each `label`, `published` and `columns`, oldest track first.
+	 */
+	public static function others( $post_id ) {
+		$post_id = (int) $post_id;
+		$others  = array();
+
+		foreach ( self::all_ids() as $id ) {
+			$id = (int) $id;
+
+			if ( $id === $post_id ) {
+				continue;
+			}
+
+			$definition = self::get( $id );
+
+			if ( ! is_array( $definition ) ) {
+				continue;
+			}
+
+			$state = self::state( $id );
+
+			$others[] = array(
+				'label'     => isset( $definition['label'] ) ? (string) $definition['label'] : '',
+				'published' => 'published' === $state || 'changed' === $state || 'builtin' === self::source( $id ),
+				'columns'   => isset( $definition['questions'] ) && is_array( $definition['questions'] ) ? array_map( 'strval', array_keys( $definition['questions'] ) ) : array(),
+			);
+		}
+
+		return $others;
+	}
+
+	/**
+	 * Whether a track has ever been published, from its log.
+	 *
+	 * The log rather than the published copy or the post status: unpublishing sets the status
+	 * back to draft and the log is the one record that survives it (the design's decision 25).
+	 *
+	 * @param int $post_id The track.
+	 * @return bool
+	 */
+	public static function ever_published( $post_id ) {
+		foreach ( self::log_entries( $post_id ) as $entry ) {
+			if ( is_array( $entry ) && isset( $entry['did'] ) && 'publish' === $entry['did'] ) {
+				return true;
+			}
+		}
+
+		return false;
+	}
+
+	/**
+	 * Delete a track that was never published.
+	 *
+	 * Decision 9 keeps every track that was ever published, because it is the record of what was
+	 * created in the base. A draft that never was created no column, holds no student's status
+	 * and was never compiled, so nothing else has to change: `compile()` reads published posts
+	 * only, and the form option it would have written was never written (decision 25). The
+	 * option is deleted all the same, in case a compile that never finished left one.
+	 *
+	 * @param int $post_id The track.
+	 * @return int|WP_Error The post ID, or why it was refused.
+	 */
+	public static function delete( $post_id ) {
+		$post_id = (int) $post_id;
+
+		if ( null === self::track_post( $post_id ) ) {
+			return new WP_Error( 'wpcpm_track_missing', __( 'That track does not exist.', 'wpcredits-program-manager' ) );
+		}
+
+		if ( 'builtin' === self::source( $post_id ) ) {
+			return new WP_Error( 'wpcpm_track_builtin', __( 'A built-in track cannot be deleted: it is the record of a form the program runs.', 'wpcredits-program-manager' ) );
+		}
+
+		if ( self::ever_published( $post_id ) ) {
+			return new WP_Error( 'wpcpm_track_was_published', __( 'This track has been published, so it is kept as the record of what was created in Airtable. It can be unpublished, not deleted.', 'wpcredits-program-manager' ) );
+		}
+
+		$definition = self::get( $post_id );
+
+		if ( is_array( $definition ) && ! empty( $definition['key'] ) ) {
+			delete_option( WPCPM_Tracks::OPT_FIELDS_PREFIX . $definition['key'] );
+		}
+
+		if ( ! wp_delete_post( $post_id, true ) ) {
+			return new WP_Error( 'wpcpm_track_not_deleted', __( 'WordPress could not delete that track.', 'wpcredits-program-manager' ) );
+		}
+
+		return $post_id;
+	}
+
 	/**
 	 * Every track's post ID, whatever its status, trash included.
 	 *
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-track-store.php`

Expected: `bin/test-track-store.php` ends `ALL PASS (154 checks)`. 

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-track-store.php includes/tracks/class-wpcpm-track-store.php
git commit -m "Track Builder T3a: the store names every other track's columns, and deletes a track never published"
```

---

### Task 5: The question editor's five handlers

**Files:**
- Create: `includes/tools/class-wpcpm-track-editor.php`
- Modify: `includes/class-wpcpm-request.php` (`exact()` and `posted_exact()`)
- Modify: `includes/tools/class-wpcpm-track-builder.php` (`boot()` boots the editor)
- Modify: `wpcredits-program-manager.php`, `uninstall.php` (the new class, after `class-wpcpm-track-builder.php`)
- Test: `bin/test-request.php`, `bin/test-track-builder.php`

**Interfaces:**
- Consumes: everything Tasks 1 and 4 produce, `WPCPM_Track_Columns::TYPES` and `LINK` for the Airtable type a control implies, `WPCPM_Track_Store::check()`, `save()`, `get()`, `published()`, `WPCPM_Flash`, `WPCPM_Return` and the builder's `admin_url()` and `FLASH`.
- Produces: `WPCPM_Track_Editor` with `ACTION_ADD` (`wpcpm_question_add`), `ACTION_SAVE` (`wpcpm_question_save`), `ACTION_MOVE` (`wpcpm_question_move`), `ACTION_REMOVE` (`wpcpm_question_remove`), `ACTION_DELETE` (`wpcpm_track_delete`) and `FIELD_ASYNC` (`wpcpm_async`); `__construct( WPCPM_Track_Builder $builder )`, `boot()`, and the five handlers. What each reads from the POST: add takes `track`, `wpcpm_column`, `wpcpm_label`, `wpcpm_type`, `wpcpm_group`; save takes `track`, `wpcpm_question` (the column being edited), `wpcpm_column` (the column to have), `wpcpm_type`, `wpcpm_label`, `wpcpm_group`, then `wpcpm_help`, `wpcpm_lead`, `wpcpm_subgroup`, `wpcpm_note`, `wpcpm_why`, `wpcpm_row`, the flags `wpcpm_stack`, `wpcpm_required`, `wpcpm_hide_from_institution` as `1`, and per control `wpcpm_min`, `wpcpm_max`, `wpcpm_step`, `wpcpm_maxlength`, `wpcpm_mono`, `wpcpm_options` (one a line); move takes `track`, `wpcpm_question`, `wpcpm_direction` and optionally `wpcpm_async=1`, answering `wp_send_json_success( array( 'order' => string[] ) )` in that case; remove takes `track` and `wpcpm_question`; delete takes `track`. `WPCPM_Track_Editor::posted_question( array $was ): array` is public static so Task 7's screen and this suite agree on what a save reads. `WPCPM_Request::exact( $name, $fallback = '' )` and `posted_exact( $name, $fallback = '' )`: unslashed, valid UTF-8, control characters dropped, never trimmed.

Not a Tool, because a Tool is a menu entry and this is the Track Builder's own second screen: the builder instantiates it in `boot()`. Every handler runs the capability check first and the nonce second (decision 3.9), then hands the decision to `WPCPM_Track_Questions` and the result to the store, and every save goes through `WPCPM_Track_Store::check()`, the call Publish makes, so the editor and the publish screen can never disagree.

`handle_save()` is where the design's rules meet, in this order: a published question keeps its column and cannot fork, each refused with the way round in the message (decision 23); a shared question whose control or choices changed takes `<column> - <key>` before anything is validated, and only while somebody else still writes the column (what this plan decides, 1); a renamed column is a rename in place. `posted_question()` reads the properties the posted control owns and no other, carries `learn_lesson_id` through untouched, and derives `airtable_type` from the control when the control changed or the question is new (what this plan decides, 3).

Two readers are new because every existing one trims. A column name is the question's key, verbatim, and the base's own `Company ` ends in a space: read through `posted_text()` or `posted_verbatim()` it would silently become a different column. `bin/test-request.php` holds the real readers to that, and the builder suite's stand-in is made faithful at the same time - its `posted_verbatim()` now trims, as the real one does - so a handler reading a column through the wrong reader fails the `Company ` checks. The suite loads the real `WPCPM_Track_Questions` and `WPCPM_Track_Columns` rather than standing them in.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-request.php b/bin/test-request.php
index 46f650f..55fab5c 100644
--- a/bin/test-request.php
+++ b/bin/test-request.php
@@ -72,6 +72,26 @@ ck( 'an absent field is the fallback', WPCPM_Request::posted_verbatim( 'missing'
 ck( 'the lines variant trims each line and drops the empty ones', WPCPM_Request::posted_verbatim_lines( 'lines' ), "A-1\nB%202" );
 ck( 'and its absent field is the fallback too', WPCPM_Request::posted_verbatim_lines( 'missing', 'none' ), 'none' );
 
+echo "\n=== posted_exact() and exact(): an Airtable column name is never trimmed ===\n";
+
+// A column name is the question's key, verbatim, and an Airtable name can end in a space (the
+// design's 4.2): the base's own `Company ` does. posted_verbatim() trims, and a column typed with
+// its space would silently become a different column (T3a).
+$_POST = array( 'column' => 'Company ', 'control' => "AB\x07C", 'tagged' => 'a <b>', 'slashed' => "It\\'s" );
+$_GET  = array( 'column' => ' Slack name ', 'tagged' => 'a <b>' );
+
+ck( 'a posted column name keeps its trailing space', WPCPM_Request::posted_exact( 'column' ), 'Company ' );
+ck( 'a control character is still dropped', WPCPM_Request::posted_exact( 'control' ), 'ABC' );
+ck( 'a tag is kept, because a name is matched and escaped, never rendered raw', WPCPM_Request::posted_exact( 'tagged' ), 'a <b>' );
+ck( 'and it is unslashed like every other reader', WPCPM_Request::posted_exact( 'slashed' ), "It's" );
+ck( 'an absent field is the fallback', WPCPM_Request::posted_exact( 'missing', 'none' ), 'none' );
+ck( 'posted_verbatim() still trims, so the two are not the same reader', WPCPM_Request::posted_verbatim( 'column' ), 'Company' );
+ck( 'the query argument keeps both its spaces, where text() would trim them', array( WPCPM_Request::exact( 'column' ), WPCPM_Request::text( 'column' ) ), array( ' Slack name ', 'Slack name' ) );
+ck( 'and keeps a tag, where text() strips it', array( WPCPM_Request::exact( 'tagged' ), WPCPM_Request::text( 'tagged' ) ), array( 'a <b>', 'a' ) );
+ck( 'an absent argument is the fallback', WPCPM_Request::exact( 'missing', 'none' ), 'none' );
+$_POST = array();
+$_GET  = array();
+
 echo "\n=== posted_list(): a ticked list, each value whole or not at all ===\n";
 
 $_POST = array(
diff --git a/bin/test-track-builder.php b/bin/test-track-builder.php
index 7d71f3d..a1e8020 100644
--- a/bin/test-track-builder.php
+++ b/bin/test-track-builder.php
@@ -37,6 +37,7 @@ function wp_nonce_field( $action ) { echo '<input type="hidden" name="_wpnonce"
 function current_user_can( $cap ) { return ! empty( $GLOBALS['can_manage'] ); }
 function check_admin_referer( $action ) { if ( ( $GLOBALS['nonce'] ?? '' ) !== $action ) { throw new DieSignal( 'the nonce was refused' ); } return true; }
 function wp_safe_redirect( $url ) { throw new RedirectSignal( (string) $url ); }
+function wp_send_json_success( $data ) { throw new JsonSignal( json_encode( array( 'success' => true, 'data' => $data ) ) ); }
 function wp_die( $message = '', $title = '', $args = array() ) { throw new DieSignal( is_string( $message ) ? $message : '' ); }
 function is_wp_error( $thing ) { return $thing instanceof WP_Error; }
 function add_action( $hook, $callback, $priority = 10, $args = 1 ) { $GLOBALS['hooks'][] = $hook; return true; }
@@ -47,6 +48,7 @@ function wp_enqueue_style( $handle, $src = '', $deps = array() ) { $GLOBALS['enq
 
 class RedirectSignal extends Exception {}
 class DieSignal extends Exception {}
+class JsonSignal extends Exception {}
 
 class WP_Error {
 	private $code;
@@ -59,7 +61,16 @@ class WP_Error {
 class WPCPM_Request {
 	public static function posted_id( $key ) { return (int) ( $_POST[ $key ] ?? 0 ); }
 	public static function id( $key ) { return (int) ( $_GET[ $key ] ?? 0 ); }
+	public static function text( $key ) { return isset( $_GET[ $key ] ) ? trim( (string) $_GET[ $key ] ) : ''; }
 	public static function posted_text( $key ) { return isset( $_POST[ $key ] ) ? trim( (string) $_POST[ $key ] ) : ''; }
+	public static function posted_key( $key ) { return isset( $_POST[ $key ] ) ? preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $_POST[ $key ] ) ) : ''; }
+	// Faithful to the real class: posted_verbatim() trims, and only posted_exact() keeps a trailing
+	// space, which is what a column name needs. A handler reading a column through the wrong one
+	// fails the `Company ` checks below (bin/test-request.php holds the real readers to this).
+	public static function posted_verbatim( $key ) { return isset( $_POST[ $key ] ) ? trim( (string) $_POST[ $key ] ) : ''; }
+	public static function posted_exact( $key ) { return isset( $_POST[ $key ] ) ? (string) $_POST[ $key ] : ''; }
+	public static function exact( $key ) { return isset( $_GET[ $key ] ) ? (string) $_GET[ $key ] : ''; }
+	public static function posted_verbatim_lines( $key ) { return isset( $_POST[ $key ] ) ? implode( "\n", array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', (string) $_POST[ $key ] ) ), 'strlen' ) ) : ''; }
 }
 
 class WPCPM_Track_Palette {
@@ -173,6 +184,51 @@ class WPCPM_Track_Store {
 		return self::$tracks[ $post_id ]['published'] ?? null;
 	}
 
+	public static function others( $post_id ) {
+		$others = array();
+
+		foreach ( self::$tracks as $id => $track ) {
+			if ( (int) $id === (int) $post_id ) {
+				continue;
+			}
+
+			$others[] = array(
+				'label'     => $track['definition']['label'] ?? '',
+				'published' => in_array( $track['state'] ?? '', array( 'published', 'changed' ), true ) || 'builtin' === ( $track['source'] ?? '' ),
+				'columns'   => array_map( 'strval', array_keys( $track['definition']['questions'] ?? array() ) ),
+			);
+		}
+
+		return $others;
+	}
+
+	public static function ever_published( $post_id ) {
+		foreach ( self::$tracks[ $post_id ]['log'] ?? array() as $entry ) {
+			if ( 'publish' === ( $entry['did'] ?? '' ) ) {
+				return true;
+			}
+		}
+
+		return false;
+	}
+
+	public static $deleted = array();
+
+	public static function delete( $post_id ) {
+		if ( ! isset( self::$tracks[ $post_id ] ) ) {
+			return new WP_Error( 'wpcpm_track_missing', 'That track does not exist.' );
+		}
+
+		if ( self::ever_published( $post_id ) ) {
+			return new WP_Error( 'wpcpm_track_was_published', 'This track has been published, so it is kept.' );
+		}
+
+		self::$deleted[] = (int) $post_id;
+		unset( self::$tracks[ $post_id ] );
+
+		return (int) $post_id;
+	}
+
 	public static $refreshed  = array();
 	public static $duplicated = array();
 	public static $saved      = array();
@@ -242,7 +298,12 @@ class WPCPM_Flash {
 	}
 }
 
+// The real rules, not a stand-in: a stand-in for WPCPM_Track_Questions would let a handler pass
+// against a rule the real class does not hold (T2c's stub-drift findings).
+require_once __DIR__ . '/../includes/tracks/class-wpcpm-track-columns.php';
+require_once __DIR__ . '/../includes/tracks/class-wpcpm-track-questions.php';
 require_once __DIR__ . '/../includes/tools/class-wpcpm-tool.php';
+require_once __DIR__ . '/../includes/tools/class-wpcpm-track-editor.php';
 require_once __DIR__ . '/../includes/tools/class-wpcpm-track-builder-screen.php';
 require_once __DIR__ . '/../includes/tools/class-wpcpm-track-builder.php';
 
@@ -978,5 +1039,308 @@ WPCPM_Track_Publish::$answer = null;
 $_POST                       = array();
 
 
+
+echo "\n=== The question editor: its handlers ===\n";
+
+$editor = new WPCPM_Track_Editor( $tool );
+$GLOBALS['hooks'] = array();
+$editor->boot();
+
+ck( 'the editor hooks its five handlers',
+    $GLOBALS['hooks'],
+    array( 'admin_post_wpcpm_question_add', 'admin_post_wpcpm_question_save', 'admin_post_wpcpm_question_move', 'admin_post_wpcpm_question_remove', 'admin_post_wpcpm_track_delete' ) );
+
+/**
+ * Press one of the editor's handlers and report what came of it.
+ *
+ * @param string $method The handler.
+ * @param array  $post   What the form posted.
+ * @return array `redirect`, `die` or `json`, and the detail.
+ */
+function press_editor( $method, array $post ) {
+	global $editor;
+	$_POST = $post;
+	WPCPM_Flash::$set = array();
+
+	try {
+		$editor->$method();
+	} catch ( RedirectSignal $e ) {
+		return array( 'redirect', $e->getMessage(), WPCPM_Flash::$set['track-builder'] ?? array() );
+	} catch ( DieSignal $e ) {
+		return array( 'die', $e->getMessage() );
+	} catch ( JsonSignal $e ) {
+		return array( 'json', json_decode( $e->getMessage(), true ) );
+	}
+
+	return array( 'fell through' );
+}
+
+/** A track of three questions across two groups, a draft of somebody's own. */
+function editable_track() {
+	return array(
+		'definition' => array(
+			'schema_version' => 1,
+			'key'            => 'marketing',
+			'status'         => 'Marketing Track',
+			'label'          => 'Marketing Track',
+			'questions'      => array(
+				'Hours'      => array( 'type' => 'number', 'label' => 'Hours', 'group' => 'hours', 'min' => 0, 'max' => 1000, 'step' => 1, 'airtable_type' => 'number' ),
+				'Slack name' => array( 'type' => 'text', 'label' => 'Your Slack name', 'group' => 'onboarding', 'airtable_type' => 'singleLineText' ),
+				'Your blog'  => array( 'type' => 'url', 'label' => 'Your blog', 'group' => 'onboarding', 'airtable_type' => 'url', 'learn_lesson_id' => 4242 ),
+			),
+		),
+		'state'       => 'draft',
+		'source'      => 'definition',
+		'log'         => array(),
+		'equivalence' => array( 'not_builtin' ),
+		'published'   => null,
+	);
+}
+
+WPCPM_Track_Store::$tracks = array(
+	13 => editable_track(),
+	11 => array(
+		'definition'  => array( 'key' => '150h', 'status' => 'In Sensei', 'label' => '150-hour Track', 'questions' => array( 'Hours' => array( 'type' => 'number' ), 'Slack name' => array( 'type' => 'text' ) ) ),
+		'state'       => 'published',
+		'source'      => 'builtin',
+		'log'         => array( array( 'at' => 1788000000, 'by' => 7, 'did' => 'publish' ) ),
+		'equivalence' => array(),
+		'published'   => array( 'key' => '150h' ),
+	),
+);
+WPCPM_Track_Store::$errors = array();
+WPCPM_Track_Store::$saved  = array();
+
+echo "\n--- capability first, then the nonce, on every handler ---\n";
+
+foreach ( array( 'handle_add', 'handle_save', 'handle_move', 'handle_remove', 'handle_delete' ) as $handler ) {
+	$GLOBALS['can_manage'] = false;
+	$GLOBALS['nonce']      = '';
+	$refused = press_editor( $handler, array( 'track' => 13 ) );
+	$GLOBALS['can_manage'] = true;
+	$nonce_refused = press_editor( $handler, array( 'track' => 13 ) );
+
+	ck( "$handler refuses somebody without the capability before it looks at the nonce, and then a bad nonce",
+	    array( $refused[0], $refused[1], $nonce_refused[0], $nonce_refused[1] ),
+	    array( 'die', 'You do not have permission to manage the program.', 'die', 'the nonce was refused' ) );
+}
+
+echo "\n--- adding ---\n";
+
+$GLOBALS['nonce'] = WPCPM_Track_Editor::ACTION_ADD;
+$added = press_editor( 'handle_add', array( 'track' => 13, 'wpcpm_column' => 'Company ', 'wpcpm_label' => 'Where you work', 'wpcpm_type' => 'text', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'a new question lands after the last of its group, with its control, its words, its group and the Airtable type its control implies',
+    array( array_keys( WPCPM_Track_Store::$saved[13]['questions'] ), WPCPM_Track_Store::$saved[13]['questions']['Company '] ),
+    array(
+        array( 'Hours', 'Slack name', 'Your blog', 'Company ' ),
+        array( 'type' => 'text', 'label' => 'Where you work', 'group' => 'onboarding', 'airtable_type' => 'singleLineText' ),
+    ) );
+
+ck( 'and the person is taken to the new question, its column name verbatim',
+    array( $added[0], $added[1], $added[2]['status'] ),
+    array( 'redirect', 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder&wpcpm_track=13&wpcpm_question=Company%20', 'success' ) );
+
+WPCPM_Track_Store::$saved = array();
+$dup = press_editor( 'handle_add', array( 'track' => 13, 'wpcpm_column' => 'Hours', 'wpcpm_label' => 'Again', 'wpcpm_type' => 'number', 'wpcpm_group' => 'hours' ) );
+
+ck( 'a column the track already asks is refused, nothing saved, and what was typed comes back',
+    array( $dup[2]['status'], $dup[2]['values']['column'], WPCPM_Track_Store::$saved ),
+    array( 'error', 'Hours', array() ) );
+
+WPCPM_Track_Store::$errors = array( array( 'code' => 'column_reserved', 'message' => 'This column belongs to the syncs.' ) );
+$reserved = press_editor( 'handle_add', array( 'track' => 13, 'wpcpm_column' => 'Status', 'wpcpm_label' => 'Your status', 'wpcpm_type' => 'text', 'wpcpm_group' => 'project' ) );
+WPCPM_Track_Store::$errors = array();
+
+ck( 'the store\'s own rules refuse through the same call the publish screen makes',
+    array( $reserved[2]['status'], $reserved[2]['message'], WPCPM_Track_Store::$saved ),
+    array( 'error', 'This column belongs to the syncs.', array() ) );
+
+$team = press_editor( 'handle_add', array( 'track' => 13, 'wpcpm_column' => 'Main Contribution Team', 'wpcpm_label' => 'Your team', 'wpcpm_type' => 'team', 'wpcpm_group' => 'project' ) );
+
+ck( 'a team question takes the link type, which no other control may',
+    array( $team[2]['status'], WPCPM_Track_Store::$saved[13]['questions']['Main Contribution Team']['airtable_type'] ?? 'not saved' ),
+    array( 'success', 'multipleRecordLinks' ) );
+
+echo "\n--- saving one question ---\n";
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+WPCPM_Track_Store::$saved      = array();
+$GLOBALS['nonce'] = WPCPM_Track_Editor::ACTION_SAVE;
+
+$saved = press_editor( 'handle_save', array(
+	'track' => 13, 'wpcpm_question' => 'Your blog', 'wpcpm_column' => 'Your blog',
+	'wpcpm_type' => 'url', 'wpcpm_label' => 'Your blog, if you have one', 'wpcpm_group' => 'onboarding',
+	'wpcpm_help' => 'The address', 'wpcpm_lead' => 'About you', 'wpcpm_required' => '1', 'wpcpm_hide_from_institution' => '1',
+	'wpcpm_row' => 'links', 'wpcpm_stack' => '1', 'wpcpm_why' => 'Kept short',
+) );
+
+ck( 'every property the control owns is read, the flags only when ticked, and the lesson id is carried through untouched',
+    WPCPM_Track_Store::$saved[13]['questions']['Your blog'],
+    array( 'type' => 'url', 'label' => 'Your blog, if you have one', 'group' => 'onboarding', 'help' => 'The address', 'lead' => 'About you', 'why' => 'Kept short', 'row' => 'links', 'stack' => true, 'required' => true, 'hide_from_institution' => true, 'airtable_type' => 'url', 'learn_lesson_id' => 4242 ) );
+
+ck( 'and the question keeps its place',
+    array_keys( WPCPM_Track_Store::$saved[13]['questions'] ), array( 'Hours', 'Slack name', 'Your blog' ) );
+
+ck( 'a save returns to the track',
+    array( $saved[0], $saved[1], $saved[2]['status'] ),
+    array( 'redirect', 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder&wpcpm_track=13', 'success' ) );
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Hours', 'wpcpm_column' => 'Hours', 'wpcpm_type' => 'number', 'wpcpm_label' => 'Hours', 'wpcpm_group' => 'hours', 'wpcpm_min' => '0', 'wpcpm_max' => '100', 'wpcpm_step' => '0.5' ) );
+
+ck( 'a number reads its bounds as numbers, a step with a point as a float',
+    array( WPCPM_Track_Store::$saved[13]['questions']['Hours']['min'], WPCPM_Track_Store::$saved[13]['questions']['Hours']['max'], WPCPM_Track_Store::$saved[13]['questions']['Hours']['step'] ),
+    array( 0, 100, 0.5 ) );
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Slack name', 'wpcpm_column' => 'Slack name', 'wpcpm_type' => 'text', 'wpcpm_label' => 'Your Slack name', 'wpcpm_group' => 'onboarding', 'wpcpm_maxlength' => '100' ) );
+
+ck( 'text reads its length limit as a whole number',
+    WPCPM_Track_Store::$saved[13]['questions']['Slack name']['maxlength'], 100 );
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Your blog', 'wpcpm_column' => 'Your blog', 'wpcpm_type' => 'select', 'wpcpm_label' => 'Your blog', 'wpcpm_group' => 'onboarding', 'wpcpm_options' => " Yes \r\n\r\nNo\n" ) );
+
+ck( 'a select reads its choices one a line, trimmed, blank lines dropped, and the control change moves the Airtable type with it',
+    array( WPCPM_Track_Store::$saved[13]['questions']['Your blog']['options'], WPCPM_Track_Store::$saved[13]['questions']['Your blog']['airtable_type'] ),
+    array( array( 'Yes', 'No' ), 'singleSelect' ) );
+
+echo "\n--- renaming a column ---\n";
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+$renamed = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Your blog', 'wpcpm_column' => 'Your website', 'wpcpm_type' => 'url', 'wpcpm_label' => 'Your blog', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'a question never published may take another column, and keeps its place',
+    array( $renamed[2]['status'], array_keys( WPCPM_Track_Store::$saved[13]['questions'] ) ),
+    array( 'success', array( 'Hours', 'Slack name', 'Your website' ) ) );
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+WPCPM_Track_Store::$saved      = array();
+$onto = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Your blog', 'wpcpm_column' => 'Hours', 'wpcpm_type' => 'url', 'wpcpm_label' => 'Your blog', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'renaming onto another question is refused, back on the question with what was typed',
+    array( $onto[2]['status'], $onto[1], WPCPM_Track_Store::$saved ),
+    array( 'error', 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder&wpcpm_track=13&wpcpm_question=Your%20blog', array() ) );
+
+echo "\n--- forking a shared column ---\n";
+
+// Slack name is shared with the 150-hour Track: rewording keeps it, a control change forks it.
+WPCPM_Track_Store::$tracks[13] = editable_track();
+$reworded = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Slack name', 'wpcpm_column' => 'Slack name', 'wpcpm_type' => 'text', 'wpcpm_label' => 'Your name in Slack', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'rewording a shared question keeps its column',
+    array( $reworded[2]['status'], array_keys( WPCPM_Track_Store::$saved[13]['questions'] ) ),
+    array( 'success', array( 'Hours', 'Slack name', 'Your blog' ) ) );
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+$forked = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Slack name', 'wpcpm_column' => 'Slack name', 'wpcpm_type' => 'textarea', 'wpcpm_label' => 'Your Slack name', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'changing the control of a shared question gives it a column of its own, named after the track, in the same place',
+    array( array_keys( WPCPM_Track_Store::$saved[13]['questions'] ), WPCPM_Track_Store::$saved[13]['questions']['Slack name - marketing']['airtable_type'] ),
+    array( array( 'Hours', 'Slack name - marketing', 'Your blog' ), 'multilineText' ) );
+
+ck( 'and the message says so, naming the new column',
+    array( $forked[2]['status'], false !== strpos( $forked[2]['message'], 'Slack name - marketing' ) ),
+    array( 'success', true ) );
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+WPCPM_Track_Store::$tracks[13]['definition']['questions']['Slack name - marketing'] = array( 'type' => 'text', 'label' => 'Taken', 'group' => 'onboarding' );
+WPCPM_Track_Store::$saved = array();
+$collision = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Slack name', 'wpcpm_column' => 'Slack name', 'wpcpm_type' => 'textarea', 'wpcpm_label' => 'Your Slack name', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'a fork whose name the track already uses is refused rather than overwriting it',
+    array( $collision[2]['status'], WPCPM_Track_Store::$saved ), array( 'error', array() ) );
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+$alone = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Your blog', 'wpcpm_column' => 'Your blog', 'wpcpm_type' => 'textarea', 'wpcpm_label' => 'Your blog', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'a question no other track shares just changes its control',
+    array( $alone[2]['status'], array_keys( WPCPM_Track_Store::$saved[13]['questions'] ) ),
+    array( 'success', array( 'Hours', 'Slack name', 'Your blog' ) ) );
+
+echo "\n--- a published question is fixed ---\n";
+
+WPCPM_Track_Store::$tracks[13]              = editable_track();
+WPCPM_Track_Store::$tracks[13]['state']     = 'published';
+WPCPM_Track_Store::$tracks[13]['published'] = array( 'questions' => array( 'Hours' => array(), 'Slack name' => array() ) );
+WPCPM_Track_Store::$saved = array();
+
+$locked_rename = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Slack name', 'wpcpm_column' => 'Slack handle', 'wpcpm_type' => 'text', 'wpcpm_label' => 'Your Slack name', 'wpcpm_group' => 'onboarding' ) );
+$locked_fork   = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Slack name', 'wpcpm_column' => 'Slack name', 'wpcpm_type' => 'textarea', 'wpcpm_label' => 'Your Slack name', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'a published question can neither take another column nor fork, and is told to remove and re-add instead',
+    array( $locked_rename[2]['status'], $locked_fork[2]['status'], false !== strpos( $locked_fork[2]['message'], 'remove it and add a new question' ), WPCPM_Track_Store::$saved ),
+    array( 'error', 'error', true, array() ) );
+
+$locked_reword = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Slack name', 'wpcpm_column' => 'Slack name', 'wpcpm_type' => 'text', 'wpcpm_label' => 'Your name in Slack', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'but its wording may still change',
+    array( $locked_reword[2]['status'], WPCPM_Track_Store::$saved[13]['questions']['Slack name']['label'] ),
+    array( 'success', 'Your name in Slack' ) );
+
+$unpublished_one = press_editor( 'handle_save', array( 'track' => 13, 'wpcpm_question' => 'Your blog', 'wpcpm_column' => 'Your site', 'wpcpm_type' => 'url', 'wpcpm_label' => 'Your blog', 'wpcpm_group' => 'onboarding' ) );
+
+ck( 'and a question added since the last publish is still free to move column',
+    array( $unpublished_one[2]['status'], array_key_exists( 'Your site', WPCPM_Track_Store::$saved[13]['questions'] ) ),
+    array( 'success', true ) );
+
+echo "\n--- moving ---\n";
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+WPCPM_Track_Store::$saved      = array();
+$GLOBALS['nonce'] = WPCPM_Track_Editor::ACTION_MOVE;
+
+$moved = press_editor( 'handle_move', array( 'track' => 13, 'wpcpm_question' => 'Your blog', 'wpcpm_direction' => 'up' ) );
+
+ck( 'a move swaps within the group, saves, and comes back to the track',
+    array( array_keys( WPCPM_Track_Store::$saved[13]['questions'] ), $moved[0], $moved[2]['status'] ),
+    array( array( 'Hours', 'Your blog', 'Slack name' ), 'redirect', 'success' ) );
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+WPCPM_Track_Store::$saved      = array();
+$edge = press_editor( 'handle_move', array( 'track' => 13, 'wpcpm_question' => 'Slack name', 'wpcpm_direction' => 'up', 'wpcpm_async' => '1' ) );
+
+ck( 'at the edge nothing is saved, and the page that asked in the background gets the order the store holds',
+    array( WPCPM_Track_Store::$saved, $edge[0], $edge[1]['data']['order'] ),
+    array( array(), 'json', array( 'Hours', 'Slack name', 'Your blog' ) ) );
+
+$async = press_editor( 'handle_move', array( 'track' => 13, 'wpcpm_question' => 'Your blog', 'wpcpm_direction' => 'up', 'wpcpm_async' => '1' ) );
+
+ck( 'a background move answers with the new order',
+    $async[1]['data']['order'], array( 'Hours', 'Your blog', 'Slack name' ) );
+
+echo "\n--- removing ---\n";
+
+WPCPM_Track_Store::$tracks[13] = editable_track();
+$GLOBALS['nonce'] = WPCPM_Track_Editor::ACTION_REMOVE;
+$removed = press_editor( 'handle_remove', array( 'track' => 13, 'wpcpm_question' => 'Slack name' ) );
+
+ck( 'a removed question leaves the track, and the message says the column and its answers stay in Airtable',
+    array( array_keys( WPCPM_Track_Store::$saved[13]['questions'] ), false !== strpos( $removed[2]['message'], 'stay in Airtable' ) ),
+    array( array( 'Hours', 'Your blog' ), true ) );
+
+WPCPM_Track_Store::$saved = array();
+$gone = press_editor( 'handle_remove', array( 'track' => 13, 'wpcpm_question' => 'Nothing here' ) );
+
+ck( 'a question that is not on the track is refused and nothing is saved',
+    array( $gone[2]['status'], WPCPM_Track_Store::$saved ), array( 'error', array() ) );
+
+echo "\n--- deleting a track ---\n";
+
+$GLOBALS['nonce'] = WPCPM_Track_Editor::ACTION_DELETE;
+WPCPM_Track_Store::$deleted = array();
+$kept = press_editor( 'handle_delete', array( 'track' => 11 ) );
+
+ck( 'a track that was ever published is refused by the store and kept',
+    array( $kept[2]['status'], WPCPM_Track_Store::$deleted, isset( WPCPM_Track_Store::$tracks[11] ) ),
+    array( 'error', array(), true ) );
+
+$deleted = press_editor( 'handle_delete', array( 'track' => 13 ) );
+
+ck( 'a draft never published is deleted, and the list says which one went',
+    array( $deleted[2]['status'], WPCPM_Track_Store::$deleted, $deleted[1], false !== strpos( $deleted[2]['message'], 'Marketing Track was deleted' ) ),
+    array( 'success', array( 13 ), 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', true ) );
+
 printf( "\n%s (%d checks)\n", $fail ? sprintf( '%d FAILURE(S)', $fail ) : 'ALL PASS', $total );
 exit( $fail ? 1 : 0 );
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-request.php` and `php bin/test-track-builder.php`

Expected: `bin/test-request.php` stops with `Fatal error: Uncaught Error: Call to undefined method WPCPM_Request::posted_exact()`; `bin/test-track-builder.php` stops with `Fatal error: Uncaught Error: Failed opening required 'includes/tools/class-wpcpm-track-editor.php'`. Neither the reader nor the editor class exists yet.

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/class-wpcpm-request.php b/includes/class-wpcpm-request.php
index 6b6edf3..c1d8806 100644
--- a/includes/class-wpcpm-request.php
+++ b/includes/class-wpcpm-request.php
@@ -66,6 +66,29 @@ class WPCPM_Request {
 		return sanitize_text_field( wp_unslash( $_GET[ $name ] ) );
 	}
 
+	/**
+	 * A query argument kept exactly as given: unslashed, valid UTF-8, control characters dropped,
+	 * and never trimmed.
+	 *
+	 * For an Airtable column name naming the question being edited. A column name is the
+	 * question's key, verbatim, and an Airtable name can end in a space (the design's 4.2):
+	 * `text()` would trim it and the question would not be found. Safe because every caller
+	 * matches the value against the columns the track holds and prints it escaped.
+	 *
+	 * @param string $name     Query argument name.
+	 * @param string $fallback Value when the argument is absent.
+	 * @return string
+	 */
+	public static function exact( $name, $fallback = '' ) {
+		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only view state; see the class docblock.
+		if ( ! isset( $_GET[ $name ] ) || ! is_scalar( $_GET[ $name ] ) ) {
+			return $fallback;
+		}
+
+		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- As above; cleaned below without touching the characters a name is made of.
+		return self::clean( wp_unslash( $_GET[ $name ] ) );
+	}
+
 	/**
 	 * A positive integer argument, such as a user ID being inspected.
 	 *
@@ -241,9 +264,42 @@ class WPCPM_Request {
 		}
 
 		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- As above; cleaned below without touching the characters a code is made of.
-		$value = wp_check_invalid_utf8( wp_unslash( $_POST[ $name ] ) );
+		return trim( self::clean( wp_unslash( $_POST[ $name ] ) ) );
+	}
+
+	/**
+	 * A posted value kept exactly as typed: the cleaning of posted_verbatim(), and no trim.
+	 *
+	 * For an Airtable column name. A question is keyed by its column name, verbatim, and an
+	 * Airtable name can end in a space (the design's 4.2): the base's own `Company ` does. Every
+	 * other reader here trims, and a column typed with its space would silently become a
+	 * different column. Safe for the same reason as posted_verbatim(): the value is matched
+	 * against what the site holds and escaped on output.
+	 *
+	 * @param string $name     Key in the posted fields.
+	 * @param string $fallback Fallback when the key is absent.
+	 * @return string
+	 */
+	public static function posted_exact( $name, $fallback = '' ) {
+		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- The caller's handler verifies the nonce before reaching here.
+		if ( ! isset( $_POST[ $name ] ) || ! is_scalar( $_POST[ $name ] ) ) {
+			return $fallback;
+		}
+
+		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- As above; cleaned below without touching the characters a name is made of.
+		return self::clean( wp_unslash( $_POST[ $name ] ) );
+	}
+
+	/**
+	 * Valid UTF-8 with control characters dropped, and nothing else touched.
+	 *
+	 * @param mixed $value An unslashed scalar.
+	 * @return string
+	 */
+	private static function clean( $value ) {
+		$value = wp_check_invalid_utf8( (string) $value );
 
-		return trim( (string) preg_replace( '/[^\P{C}\n\r\t]+/u', '', (string) $value ) );
+		return (string) preg_replace( '/[^\P{C}\n\r\t]+/u', '', (string) $value );
 	}
 
 	/**
diff --git a/includes/tools/class-wpcpm-track-builder.php b/includes/tools/class-wpcpm-track-builder.php
index 339710d..3eddb25 100644
--- a/includes/tools/class-wpcpm-track-builder.php
+++ b/includes/tools/class-wpcpm-track-builder.php
@@ -135,6 +135,10 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 		add_action( 'admin_post_' . self::ACTION_TICK, array( $this, 'handle_tick' ) );
 		add_action( 'admin_post_' . self::ACTION_UNTICK, array( $this, 'handle_untick' ) );
 		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
+
+		// The question editor's five handlers live in a class of their own, so this one stays the
+		// track's and the editor stays the questions' (the design's decision 22).
+		( new WPCPM_Track_Editor( $this ) )->boot();
 	}
 
 	/**
diff --git a/includes/tools/class-wpcpm-track-editor.php b/includes/tools/class-wpcpm-track-editor.php
new file mode 100644
index 0000000..fafdf3b
--- /dev/null
+++ b/includes/tools/class-wpcpm-track-editor.php
@@ -0,0 +1,543 @@
+<?php
+/**
+ * Tools - the Track Builder's question editor: its handlers.
+ *
+ * @package WPCreditsProgramManager
+ */
+
+if ( ! defined( 'ABSPATH' ) ) {
+	exit;
+}
+
+/**
+ * What a press on the question editor does: add, save, move, remove a question, or delete a track.
+ *
+ * Not a Tool, because a Tool is a menu entry and this is the Track Builder's own second screen.
+ * Every handler runs the capability check first and the nonce check second (the design's
+ * decision 3.9), then hands the decision to `WPCPM_Track_Questions` and the result to the store:
+ * this class reads the request and writes the answer, and decides nothing about a question itself.
+ * Every save goes through `WPCPM_Track_Store::check()`, the same call Publish makes, so the
+ * editor and the publish screen can never disagree about a definition.
+ */
+final class WPCPM_Track_Editor {
+
+	/** Add a question to a group. */
+	const ACTION_ADD = 'wpcpm_question_add';
+
+	/** Save one question's properties. */
+	const ACTION_SAVE = 'wpcpm_question_save';
+
+	/** Move a question one place within its group. */
+	const ACTION_MOVE = 'wpcpm_question_move';
+
+	/** Take a question out of the track. */
+	const ACTION_REMOVE = 'wpcpm_question_remove';
+
+	/** Delete a track that was never published. */
+	const ACTION_DELETE = 'wpcpm_track_delete';
+
+	/** The field a move carries when the page asked in the background. */
+	const FIELD_ASYNC = 'wpcpm_async';
+
+	/**
+	 * The Track Builder, for the screen's URL.
+	 *
+	 * @var WPCPM_Track_Builder
+	 */
+	private $builder;
+
+	/**
+	 * The editor belongs to the Track Builder's screen.
+	 *
+	 * @param WPCPM_Track_Builder $builder The tool whose screen this editor is part of.
+	 */
+	public function __construct( WPCPM_Track_Builder $builder ) {
+		$this->builder = $builder;
+	}
+
+	/**
+	 * Hook the five handlers.
+	 */
+	public function boot() {
+		add_action( 'admin_post_' . self::ACTION_ADD, array( $this, 'handle_add' ) );
+		add_action( 'admin_post_' . self::ACTION_SAVE, array( $this, 'handle_save' ) );
+		add_action( 'admin_post_' . self::ACTION_MOVE, array( $this, 'handle_move' ) );
+		add_action( 'admin_post_' . self::ACTION_REMOVE, array( $this, 'handle_remove' ) );
+		add_action( 'admin_post_' . self::ACTION_DELETE, array( $this, 'handle_delete' ) );
+	}
+
+	/**
+	 * Add a question at the end of a group, then open it.
+	 *
+	 * The column name, the words a student reads, the control and the group: the four things a
+	 * question cannot do without (4.2 makes `label` required, and never a copy of the column
+	 * name), so the new question is valid the moment it exists and everything else is edited on
+	 * its own screen.
+	 */
+	public function handle_add() {
+		$this->verify( self::ACTION_ADD );
+
+		$post_id = WPCPM_Request::posted_id( 'track' );
+		$stored  = $this->stored( $post_id );
+		$column  = WPCPM_Request::posted_exact( 'wpcpm_column' );
+		$type    = WPCPM_Request::posted_key( 'wpcpm_type' );
+		$group   = WPCPM_Request::posted_key( 'wpcpm_group' );
+		$typed   = array(
+			'column' => $column,
+			'label'  => WPCPM_Request::posted_text( 'wpcpm_label' ),
+			'type'   => $type,
+			'group'  => $group,
+		);
+
+		$question = array(
+			'type'  => $type,
+			'label' => $typed['label'],
+			'group' => $group,
+		);
+
+		$airtable_type = self::airtable_type( $type );
+
+		if ( '' !== $airtable_type ) {
+			$question['airtable_type'] = $airtable_type;
+		}
+
+		$questions = WPCPM_Track_Questions::add( self::questions( $stored ), $column, $question );
+
+		if ( null === $questions ) {
+			$this->refuse( $post_id, __( 'This track already has a question on that column. One column, one question.', 'wpcredits-program-manager' ), $typed );
+		}
+
+		$definition              = $stored;
+		$definition['questions'] = $questions;
+
+		$this->store( $post_id, $definition, $typed );
+
+		$this->redirect_back(
+			array(
+				'status'  => 'success',
+				'message' => __( 'The question was added. Fill in what it asks, then save it.', 'wpcredits-program-manager' ),
+			),
+			array(
+				'wpcpm_track'    => $post_id,
+				'wpcpm_question' => $column,
+			)
+		);
+	}
+
+	/**
+	 * Save one question: its properties, and its column when that may change.
+	 *
+	 * Three rules meet here, all decided by `WPCPM_Track_Questions` and only applied in this
+	 * order. A published question keeps its column (decision 23): a different name is refused,
+	 * and so is a change that would fork, with the way round named. A shared question whose
+	 * control or options changed takes a column of its own (the design's 5). And a renamed
+	 * column is a rename, the question keeping its place.
+	 */
+	public function handle_save() {
+		$this->verify( self::ACTION_SAVE );
+
+		$post_id   = WPCPM_Request::posted_id( 'track' );
+		$stored    = $this->stored( $post_id );
+		$current   = WPCPM_Request::posted_exact( 'wpcpm_question' );
+		$column    = WPCPM_Request::posted_exact( 'wpcpm_column' );
+		$questions = self::questions( $stored );
+
+		if ( ! array_key_exists( $current, $questions ) ) {
+			$this->redirect_back(
+				array(
+					'status'  => 'error',
+					'message' => __( 'That question is no longer on this track.', 'wpcredits-program-manager' ),
+				),
+				array( 'wpcpm_track' => $post_id )
+			);
+		}
+
+		$was       = (array) $questions[ $current ];
+		$question  = self::posted_question( $was );
+		$typed     = array_merge( $question, array( 'column' => $column ) );
+		$published = WPCPM_Track_Store::published( $post_id );
+		$locked    = WPCPM_Track_Questions::locked( $current, is_array( $published ) && isset( $published['questions'] ) ? (array) $published['questions'] : array() );
+		$others    = WPCPM_Track_Store::others( $post_id );
+		$forks     = WPCPM_Track_Questions::forks( $question, $was );
+
+		if ( $locked && $column !== $current ) {
+			$this->refuse( $post_id, __( 'This question has been published, so its column is fixed: the column holds what students have already written. To move the question to another column, remove it and add a new one.', 'wpcredits-program-manager' ), $typed, $current );
+		}
+
+		if ( $locked && $forks ) {
+			$this->refuse( $post_id, __( 'This question has been published, so its control and its choices are fixed: the column in Airtable has that shape. To ask it differently, remove it and add a new question with a column of its own.', 'wpcredits-program-manager' ), $typed, $current );
+		}
+
+		$target = $column;
+
+		// A shared column forks the moment the control or the choices change, before anything is
+		// validated: the fork is what protects the other tracks, and the person sees it on the
+		// screen that comes back. A renamed column is the person's own choice of name and is
+		// left as typed.
+		if ( $column === $current && $forks && array() !== WPCPM_Track_Questions::owners( $current, $others ) ) {
+			$target = WPCPM_Track_Questions::fork_name( $current, isset( $stored['key'] ) ? (string) $stored['key'] : '' );
+		}
+
+		$questions[ $current ] = $question;
+
+		if ( $target !== $current ) {
+			$questions = WPCPM_Track_Questions::rename( $questions, $current, $target );
+
+			if ( null === $questions ) {
+				$this->refuse( $post_id, __( 'This track already has a question on that column. One column, one question.', 'wpcredits-program-manager' ), $typed, $current );
+			}
+		}
+
+		$definition              = $stored;
+		$definition['questions'] = $questions;
+
+		$this->store( $post_id, $definition, $typed, $current );
+
+		$this->redirect_back(
+			array(
+				'status'  => 'success',
+				'message' => $target === $current
+					? __( 'The question was saved. Nothing reaches students until the track is published.', 'wpcredits-program-manager' )
+					: sprintf(
+						/* translators: %s: the column the question now writes. */
+						__( 'The question was saved and now has a column of its own, %s, so the tracks that share the old column are not changed. Nothing reaches students until the track is published.', 'wpcredits-program-manager' ),
+						$target
+					),
+			),
+			array( 'wpcpm_track' => $post_id )
+		);
+	}
+
+	/**
+	 * Move a question one place up or down within its group.
+	 *
+	 * The page moves the row the moment the arrow is pressed and posts this in the background
+	 * (`assets/js/track-editor.js`); the answer carries the order the store kept, and a refusal
+	 * puts the row back. Without the script the form posts the ordinary way and comes back.
+	 */
+	public function handle_move() {
+		$this->verify( self::ACTION_MOVE );
+
+		$post_id   = WPCPM_Request::posted_id( 'track' );
+		$stored    = $this->stored( $post_id );
+		$column    = WPCPM_Request::posted_exact( 'wpcpm_question' );
+		$direction = WPCPM_Request::posted_key( 'wpcpm_direction' );
+		$questions = self::questions( $stored );
+
+		if ( array_key_exists( $column, $questions ) && in_array( $direction, array( 'up', 'down' ), true ) ) {
+			$moved = WPCPM_Track_Questions::move( $questions, $column, $direction );
+
+			if ( $moved !== $questions ) {
+				$definition              = $stored;
+				$definition['questions'] = $moved;
+				$saved                   = WPCPM_Track_Store::save( $post_id, $definition );
+
+				if ( is_wp_error( $saved ) ) {
+					$this->refuse( $post_id, $saved->get_error_message(), array() );
+				}
+
+				$questions = $moved;
+			}
+		}
+
+		if ( '1' === WPCPM_Request::posted_key( self::FIELD_ASYNC ) ) {
+			wp_send_json_success( array( 'order' => array_map( 'strval', array_keys( $questions ) ) ) );
+		}
+
+		$this->redirect_back(
+			array(
+				'status'  => 'success',
+				'message' => __( 'The question was moved.', 'wpcredits-program-manager' ),
+			),
+			array( 'wpcpm_track' => $post_id )
+		);
+	}
+
+	/**
+	 * Take a question out of the track.
+	 *
+	 * The column and what students wrote in it stay in Airtable, because nothing is deleted there
+	 * (decision 9); the screen's confirmation says so before this runs.
+	 */
+	public function handle_remove() {
+		$this->verify( self::ACTION_REMOVE );
+
+		$post_id   = WPCPM_Request::posted_id( 'track' );
+		$stored    = $this->stored( $post_id );
+		$column    = WPCPM_Request::posted_exact( 'wpcpm_question' );
+		$questions = self::questions( $stored );
+
+		if ( ! array_key_exists( $column, $questions ) ) {
+			$this->redirect_back(
+				array(
+					'status'  => 'error',
+					'message' => __( 'That question is no longer on this track.', 'wpcredits-program-manager' ),
+				),
+				array( 'wpcpm_track' => $post_id )
+			);
+		}
+
+		$definition              = $stored;
+		$definition['questions'] = WPCPM_Track_Questions::remove( $questions, $column );
+
+		$this->store( $post_id, $definition, array() );
+
+		$this->redirect_back(
+			array(
+				'status'  => 'success',
+				'message' => __( 'The question was removed from the track. Its column, and whatever students wrote in it, stay in Airtable.', 'wpcredits-program-manager' ),
+			),
+			array( 'wpcpm_track' => $post_id )
+		);
+	}
+
+	/**
+	 * Delete a track that was never published (decision 25). The store refuses every other one.
+	 */
+	public function handle_delete() {
+		$this->verify( self::ACTION_DELETE );
+
+		$post_id = WPCPM_Request::posted_id( 'track' );
+		$stored  = WPCPM_Track_Store::get( $post_id );
+		$label   = is_array( $stored ) && isset( $stored['label'] ) ? (string) $stored['label'] : '';
+		$deleted = WPCPM_Track_Store::delete( $post_id );
+
+		if ( is_wp_error( $deleted ) ) {
+			$this->redirect_back(
+				array(
+					'status'  => 'error',
+					'message' => $deleted->get_error_message(),
+				)
+			);
+		}
+
+		$this->redirect_back(
+			array(
+				'status'  => 'success',
+				'message' => sprintf(
+					/* translators: %s: the track's name. */
+					__( '%s was deleted. It was never published, so nothing in Airtable or on the live site referred to it.', 'wpcredits-program-manager' ),
+					$label
+				),
+			)
+		);
+	}
+
+	/**
+	 * A question's properties as posted, on top of the ones the form does not show.
+	 *
+	 * Every property 4.2 lists, read for the control that owns it and left out otherwise, so
+	 * `validate()` sees exactly what a person set and nothing a previous control left behind.
+	 * `learn_lesson_id` and `why` are carried through: the first until T3c makes it editable,
+	 * the second because a developer's note is worth keeping across a save that did not touch it.
+	 *
+	 * @param array $was The question as it is stored.
+	 * @return array
+	 */
+	public static function posted_question( array $was ) {
+		$type     = WPCPM_Request::posted_key( 'wpcpm_type' );
+		$question = array(
+			'type'  => $type,
+			'label' => WPCPM_Request::posted_text( 'wpcpm_label' ),
+			'group' => WPCPM_Request::posted_key( 'wpcpm_group' ),
+		);
+
+		foreach ( array( 'help', 'lead', 'subgroup', 'note', 'why' ) as $property ) {
+			$value = WPCPM_Request::posted_text( 'wpcpm_' . $property );
+
+			if ( '' !== $value ) {
+				$question[ $property ] = $value;
+			}
+		}
+
+		$row = WPCPM_Request::posted_key( 'wpcpm_row' );
+
+		if ( '' !== $row ) {
+			$question['row'] = $row;
+		}
+
+		foreach ( array( 'stack', 'required', 'hide_from_institution' ) as $flag ) {
+			if ( '1' === WPCPM_Request::posted_key( 'wpcpm_' . $flag ) ) {
+				$question[ $flag ] = true;
+			}
+		}
+
+		if ( 'number' === $type ) {
+			foreach ( array( 'min', 'max', 'step' ) as $bound ) {
+				$value = WPCPM_Request::posted_text( 'wpcpm_' . $bound );
+
+				if ( '' !== $value && is_numeric( $value ) ) {
+					$question[ $bound ] = false === strpos( $value, '.' ) ? (int) $value : (float) $value;
+				} elseif ( '' !== $value ) {
+					$question[ $bound ] = $value;
+				}
+			}
+		}
+
+		if ( 'text' === $type ) {
+			$maxlength = WPCPM_Request::posted_text( 'wpcpm_maxlength' );
+
+			if ( '' !== $maxlength ) {
+				$question['maxlength'] = ctype_digit( $maxlength ) ? (int) $maxlength : $maxlength;
+			}
+		}
+
+		if ( 'textarea' === $type && '1' === WPCPM_Request::posted_key( 'wpcpm_mono' ) ) {
+			$question['mono'] = true;
+		}
+
+		if ( 'select' === $type ) {
+			$lines               = WPCPM_Request::posted_verbatim_lines( 'wpcpm_options' );
+			$question['options'] = '' === $lines ? array() : explode( "\n", $lines );
+		}
+
+		// The Airtable type follows the control for a column being created, and is whatever the
+		// base says for one that already exists (the design's 5): so it moves with the control and
+		// stays put otherwise, and a column that exists with another type is the preflight's to
+		// refuse.
+		if ( isset( $was['type'] ) && (string) $was['type'] === $type && isset( $was['airtable_type'] ) ) {
+			$question['airtable_type'] = (string) $was['airtable_type'];
+		} else {
+			$airtable_type = self::airtable_type( $type );
+
+			if ( '' !== $airtable_type ) {
+				$question['airtable_type'] = $airtable_type;
+			}
+		}
+
+		foreach ( array( 'learn_lesson_id' ) as $carried ) {
+			if ( isset( $was[ $carried ] ) ) {
+				$question[ $carried ] = $was[ $carried ];
+			}
+		}
+
+		return $question;
+	}
+
+	/**
+	 * The Airtable type a control's new column gets.
+	 *
+	 * @param string $type The control.
+	 * @return string Empty for a control that never creates a column.
+	 */
+	private static function airtable_type( $type ) {
+		if ( 'team' === $type ) {
+			return WPCPM_Track_Columns::LINK;
+		}
+
+		return isset( WPCPM_Track_Columns::TYPES[ $type ] ) ? WPCPM_Track_Columns::TYPES[ $type ] : '';
+	}
+
+	/**
+	 * A definition's questions, as a map.
+	 *
+	 * @param array $definition The definition.
+	 * @return array
+	 */
+	private static function questions( array $definition ) {
+		return isset( $definition['questions'] ) && is_array( $definition['questions'] ) ? $definition['questions'] : array();
+	}
+
+	/**
+	 * The definition a handler works on, or the list with a refusal.
+	 *
+	 * @param int $post_id The track.
+	 * @return array
+	 */
+	private function stored( $post_id ) {
+		$stored = WPCPM_Track_Store::get( $post_id );
+
+		if ( ! is_array( $stored ) ) {
+			$this->redirect_back(
+				array(
+					'status'  => 'error',
+					'message' => __( 'That track does not exist.', 'wpcredits-program-manager' ),
+				)
+			);
+		}
+
+		return $stored;
+	}
+
+	/**
+	 * Check the whole definition and save it, or come back with the first refusal.
+	 *
+	 * @param int    $post_id    The track.
+	 * @param array  $definition The definition with the change applied.
+	 * @param array  $typed      What was posted, so nothing has to be retyped.
+	 * @param string $question   The question screen to come back to, or empty for the add form.
+	 */
+	private function store( $post_id, array $definition, array $typed, $question = '' ) {
+		$errors = WPCPM_Track_Store::check( $post_id, $definition );
+
+		if ( array() !== $errors ) {
+			$this->refuse( $post_id, (string) $errors[0]['message'], $typed, $question );
+		}
+
+		$saved = WPCPM_Track_Store::save( $post_id, $definition );
+
+		if ( is_wp_error( $saved ) ) {
+			$this->refuse( $post_id, $saved->get_error_message(), $typed, $question );
+		}
+	}
+
+	/**
+	 * Back to the screen the press came from, with the refusal and what was typed.
+	 *
+	 * @param int    $post_id  The track.
+	 * @param string $message  Why it was refused.
+	 * @param array  $typed    What was posted.
+	 * @param string $question The question being edited, or empty when a question was being added.
+	 */
+	private function refuse( $post_id, $message, array $typed, $question = '' ) {
+		$args = array( 'wpcpm_track' => $post_id );
+
+		if ( '' !== $question ) {
+			$args['wpcpm_question'] = $question;
+		}
+
+		$this->redirect_back(
+			array(
+				'status'  => 'error',
+				'message' => $message,
+				'values'  => $typed,
+			),
+			$args
+		);
+	}
+
+	/**
+	 * The capability, then the nonce, before a handler does anything (decision 3.9).
+	 *
+	 * The Track Builder has the same two lines. They are not shared through a base class because
+	 * the tool's are private to it and this editor is not a tool: making it one would give it a
+	 * menu entry of its own.
+	 *
+	 * @param string $action The action being verified.
+	 */
+	private function verify( $action ) {
+		if ( ! current_user_can( WPCPM_Roles::CAP_MANAGE ) ) {
+			wp_die( esc_html__( 'You do not have permission to manage the program.', 'wpcredits-program-manager' ), 403 );
+		}
+
+		check_admin_referer( $action );
+	}
+
+	/**
+	 * Back to the Track Builder, with what happened flashed for the person who pressed.
+	 *
+	 * @param array $outcome `status`, `message`, and `values` when a form has to come back.
+	 * @param array $args    Query arguments naming the screen to come back to; none for the list.
+	 */
+	private function redirect_back( array $outcome, array $args = array() ) {
+		$url = $this->builder->admin_url();
+
+		foreach ( $args as $key => $value ) {
+			$url = add_query_arg( $key, $value, $url );
+		}
+
+		WPCPM_Flash::set( WPCPM_Track_Builder::FLASH, $outcome );
+		wp_safe_redirect( class_exists( 'WPCPM_Return' ) ? WPCPM_Return::url( $url ) : $url );
+		exit;
+	}
+}
diff --git a/uninstall.php b/uninstall.php
index 4d9b118..9fa658e 100644
--- a/uninstall.php
+++ b/uninstall.php
@@ -151,6 +151,7 @@ require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-duplicate
 require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-duplicate-finder.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-track-builder-screen.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-track-builder.php';
+require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-track-editor.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/class-wpcpm-tools.php';
 
 WPCPM_Modules::uninstall();
diff --git a/wpcredits-program-manager.php b/wpcredits-program-manager.php
index 1ef6603..fc3f1ed 100644
--- a/wpcredits-program-manager.php
+++ b/wpcredits-program-manager.php
@@ -145,6 +145,7 @@ require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-duplicate-finder-scr
 require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-duplicate-finder.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-track-builder-screen.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-track-builder.php';
+require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-track-editor.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/class-wpcpm-tools.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/class-wpcpm-dashboards.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/class-wpcpm-admin.php';
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-request.php` and `php bin/test-track-builder.php`

Expected: `bin/test-request.php` ends `ALL PASS (29 checks)` and `bin/test-track-builder.php` ends `ALL PASS (123 checks)`. `php bin/test-roles.php` ends `ALL PASS` as well.

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-request.php bin/test-track-builder.php includes/class-wpcpm-request.php includes/tools/class-wpcpm-track-builder.php includes/tools/class-wpcpm-track-editor.php wpcredits-program-manager.php uninstall.php
git commit -m "Track Builder T3a: the question editor's five handlers"
```

---

### Task 6: The question list under a track's properties

**Files:**
- Create: `includes/tools/class-wpcpm-track-editor-screen.php`, `assets/js/track-editor.js`
- Modify: `includes/tools/class-wpcpm-track-builder.php` (`form()` carries `questions` and `others`; `enqueue_assets()` enqueues the script)
- Modify: `includes/tools/class-wpcpm-track-builder-screen.php` (`render_form()` draws the list, and draws it read-only for a built-in track)
- Modify: `assets/css/track-builder.css`, `wpcredits-program-manager.php`, `uninstall.php` (the new class, before `class-wpcpm-track-editor.php`)
- Test: `bin/test-track-builder.php`

**Interfaces:**
- Consumes: Task 1's `owners()` and `forked_from()`, Task 4's `others()`, Task 5's action constants.
- Produces: `WPCPM_Track_Editor_Screen::groups()` (the four groups and their labels, in the Student Report Card's order), `controls()` (the ten controls, named for a person), and `render_questions( array $args )` with `track`, `key`, `questions`, `others`, `url` and `read_only`. Each row is `<tr class="wpcpm-question" id="wpcpm-question-<md5 of the column>" data-wpcpm-column="<column>" data-wpcpm-group="<group>">`, which is what the script moves rows by. `WPCPM_Track_Builder::form()` gains `questions` and `others`.

The design's section 6 as amended: one table a group, in the order the Student Report Card draws them; per row the words, the column as code, the control by name, and the notice - shared with the tracks it names, a draft marked as one, or forked from a column; per row Edit, two arrows and Remove behind a confirmation that says the column and every answer stay in Airtable; per group an add form asking for the column, the words and the control (what this plan decides, 4). A built-in track running from its PHP shows its questions with nothing to press and no add form, under the note that already points at Duplicate.

The script is `assets/js/modules.js` again, for rows in groups: the row moves the moment the arrow is pressed and the same form posts in the background with `wpcpm_async=1`; the answer carries the order the store kept; a refusal puts the row back and the live region says so; an arrow at its group's edge is disabled. Without the script the forms post the ordinary way and come back.

Two T2b checks change because their contract did: `form()` now carries the questions, and the screen enqueues a script beside its stylesheet. And `name="wpcpm_label"` now appears in five forms on the page - the track's, and one add form a group - so the T2b check that counted one counts the properties form's by its `id`.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-track-builder.php b/bin/test-track-builder.php
index a1e8020..8a504cd 100644
--- a/bin/test-track-builder.php
+++ b/bin/test-track-builder.php
@@ -45,6 +45,8 @@ function get_current_user_id() { return 5; }
 function get_userdata( $id ) { return isset( $GLOBALS['users'][ (int) $id ] ) ? (object) array( 'display_name' => $GLOBALS['users'][ (int) $id ] ) : false; }
 function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['opts'] ) ? $GLOBALS['opts'][ $k ] : $d; }
 function wp_enqueue_style( $handle, $src = '', $deps = array() ) { $GLOBALS['enqueued'][] = array( 'style', $handle, $deps ); }
+function wp_enqueue_script( $handle, $src = '', $deps = array(), $ver = false, $footer = false ) { $GLOBALS['enqueued'][] = array( 'script', $handle, $deps, $footer ); }
+function esc_js( $s ) { return str_replace( array( '\\', "'" ), array( '\\\\', "\\'" ), (string) $s ); }
 
 class RedirectSignal extends Exception {}
 class DieSignal extends Exception {}
@@ -304,6 +306,7 @@ require_once __DIR__ . '/../includes/tracks/class-wpcpm-track-columns.php';
 require_once __DIR__ . '/../includes/tracks/class-wpcpm-track-questions.php';
 require_once __DIR__ . '/../includes/tools/class-wpcpm-tool.php';
 require_once __DIR__ . '/../includes/tools/class-wpcpm-track-editor.php';
+require_once __DIR__ . '/../includes/tools/class-wpcpm-track-editor-screen.php';
 require_once __DIR__ . '/../includes/tools/class-wpcpm-track-builder-screen.php';
 require_once __DIR__ . '/../includes/tools/class-wpcpm-track-builder.php';
 
@@ -485,19 +488,20 @@ ck( 'and the handler is on admin-post', in_array( 'admin_post_' . WPCPM_Track_Bu
 ck( 'and the assets are hooked to admin_enqueue_scripts', in_array( 'admin_enqueue_scripts', $GLOBALS['hooks'], true ), true );
 
 $tool->enqueue_assets( 'wpcredits-program_page_wpcpm-tool-track-builder' );
-ck( 'its stylesheet builds on the plugin\'s admin sheet, on its own screen', $GLOBALS['enqueued'], array( array( 'style', 'wpcpm-track-builder', array( 'wpcpm-admin' ) ) ) );
+ck( 'its stylesheet builds on the plugin\'s admin sheet, on its own screen, and the question list\'s script rides in the footer (T3a)', $GLOBALS['enqueued'], array( array( 'style', 'wpcpm-track-builder', array( 'wpcpm-admin' ) ), array( 'script', 'wpcpm-track-editor', array(), true ) ) );
 $GLOBALS['enqueued'] = array();
 $tool->enqueue_assets( 'wpcredits-program_page_wpcpm-settings' );
 ck( 'and on no other', $GLOBALS['enqueued'], array() );
 
 echo "\n=== The properties form ===\n";
 
-// The questions are T3's; this edits what a track is, not what it asks. A built-in track its PHP
-// still runs is read-only here, because its equivalence with that PHP is what the switch rests on
-// (spec section 6), and the store refuses the save in any case.
-ck( 'the form offers the track properties, and nothing about its questions',
+// The properties edit what a track is; since T3a the form also carries what it asks, and every
+// other track's columns for the sharing index, so the list under the properties is drawn from one
+// read. A built-in track its PHP still runs is read-only here, because its equivalence with that
+// PHP is what the switch rests on (spec section 6), and the store refuses the save in any case.
+ck( 'the form offers the track properties, then its questions and every other track\'s columns',
     array_keys( WPCPM_Track_Builder::form( 13 ) ),
-    array( 'id', 'label', 'status', 'key', 'course_url', 'learn_course_id', 'hours_target', 'hue', 'read_only' ) );
+    array( 'id', 'label', 'status', 'key', 'course_url', 'learn_course_id', 'hours_target', 'hue', 'read_only', 'questions', 'others' ) );
 ck( 'filled from the definition', array( WPCPM_Track_Builder::form( 13 )['label'], WPCPM_Track_Builder::form( 13 )['status'], WPCPM_Track_Builder::form( 13 )['read_only'] ), array( 'Marketing Track', 'Marketing Track', false ) );
 ck( 'and a built-in track its PHP runs is read-only', WPCPM_Track_Builder::form( 11 )['read_only'], true );
 
@@ -505,7 +509,8 @@ ob_start();
 WPCPM_Track_Builder_Screen::render_form( array( 'form' => WPCPM_Track_Builder::form( 13 ), 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => array() ) );
 $form = ob_get_clean();
 ck( 'the form posts to the save action with a field per property',
-    array( substr_count( $form, 'name="action" value="wpcpm_track_save"' ), substr_count( $form, 'name="wpcpm_label"' ), substr_count( $form, 'name="wpcpm_status"' ), substr_count( $form, 'name="wpcpm_key"' ), substr_count( $form, 'name="wpcpm_hours_target"' ) ),
+    // By id, since T3a: each add form under the list has a `wpcpm_label` of its own, for the question's words.
+    array( substr_count( $form, 'name="action" value="wpcpm_track_save"' ), substr_count( $form, 'id="wpcpm_label" name="wpcpm_label"' ), substr_count( $form, 'name="wpcpm_status"' ), substr_count( $form, 'name="wpcpm_key"' ), substr_count( $form, 'name="wpcpm_hours_target"' ) ),
     array( 1, 1, 1, 1, 1 ) );
 
 // A refusal flashes what was typed, and the form has to prefer it over the stored value - the
@@ -1342,5 +1347,114 @@ ck( 'a draft never published is deleted, and the list says which one went',
     array( $deleted[2]['status'], WPCPM_Track_Store::$deleted, $deleted[1], false !== strpos( $deleted[2]['message'], 'Marketing Track was deleted' ) ),
     array( 'success', array( 13 ), 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', true ) );
 
+
+echo "\n=== The question list under a track's properties ===\n";
+
+WPCPM_Track_Store::$tracks = array(
+	13 => editable_track(),
+	11 => array(
+		'definition'  => array( 'key' => '150h', 'status' => 'In Sensei', 'label' => '150-hour Track', 'questions' => array( 'Hours' => array( 'type' => 'number', 'label' => 'Hours', 'group' => 'hours' ), 'Slack name' => array( 'type' => 'text', 'label' => 'Slack', 'group' => 'onboarding' ) ) ),
+		'state'       => 'published',
+		'source'      => 'builtin',
+		'log'         => array( array( 'at' => 1788000000, 'by' => 7, 'did' => 'publish' ) ),
+		'equivalence' => array(),
+		'published'   => array( 'key' => '150h' ),
+	),
+);
+WPCPM_Track_Store::$tracks[13]['definition']['questions']['Slack name - marketing'] = array( 'type' => 'textarea', 'label' => 'Your Slack name, at length', 'group' => 'onboarding' );
+
+$form = WPCPM_Track_Builder::form( 13 );
+
+ck( 'form() carries the questions in order and every other track\'s columns',
+    array( array_keys( $form['questions'] ), array_column( $form['others'], 'label' ) ),
+    array( array( 'Hours', 'Slack name', 'Your blog', 'Slack name - marketing' ), array( '150-hour Track' ) ) );
+
+ob_start();
+WPCPM_Track_Builder_Screen::render_form( array( 'form' => $form, 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => array() ) );
+$list = ob_get_clean();
+
+ck( 'the four groups are drawn in the order the Student Report Card uses, each with its heading',
+    array_map( function ( $m ) { return $m; }, preg_match_all( '/<h3>([^<]+)<\/h3>/', $list, $m ) ? $m[1] : array() ),
+    array( 'Total hours', 'Onboarding', 'Project', 'Wrap-up' ) );
+
+ck( 'a group with nothing in it says so, and still offers Add',
+    array( substr_count( $list, 'No questions in this group.' ), substr_count( $list, 'name="wpcpm_group" value="wrapup"' ) ),
+    array( 2, 1 ) );
+
+preg_match_all( '/<tr class="wpcpm-question" id="wpcpm-question-[a-f0-9]{32}" data-wpcpm-column="([^"]*)" data-wpcpm-group="([^"]*)">/', $list, $rows_found );
+
+ck( 'each row carries its column verbatim and its group, in page order',
+    array( $rows_found[1], $rows_found[2] ),
+    array( array( 'Hours', 'Slack name', 'Your blog', 'Slack name - marketing' ), array( 'hours', 'onboarding', 'onboarding', 'onboarding' ) ) );
+
+ck( 'the words, the column as code, and the control by its name',
+    array(
+        false !== strpos( $list, '<strong>Your Slack name</strong><code class="wpcpm-question__column">Slack name</code>' ),
+        substr_count( $list, '<td>Text, one line</td>' ),
+        substr_count( $list, '<td>Web address</td>' ),
+    ),
+    array( true, 1, 1 ) );
+
+ck( 'a column another track writes says so, naming it, and a fork says what it came from',
+    array(
+        substr_count( $list, 'Shared with 150-hour Track. Rewording keeps the column' ),
+        false !== strpos( $list, 'A column of this track&#039;s own, forked from Slack name.' ),
+        false === strpos( $list, 'Shared with' . ' ' . 'Marketing' ),
+    ),
+    array( 2, true, true ) );
+
+ck( 'each row offers Edit by column name, two arrows in a background-ready form, and Remove behind a confirmation that says what stays in Airtable',
+    array(
+        substr_count( $list, 'wpcpm_question=Slack%20name%20-%20marketing">Edit</a>' ),
+        substr_count( $list, 'class="wpcpm-question__mover" data-wpcpm-refused="The move was not saved. The question is back where it was."' ),
+        substr_count( $list, 'name="wpcpm_direction" value="up"' ),
+        substr_count( $list, 'name="wpcpm_direction" value="down"' ),
+        substr_count( $list, 'onsubmit="return confirm(\'Remove this question from the track? Its column, and whatever students wrote in it, stay in Airtable.\');"' ),
+    ),
+    array( 1, 4, 4, 4, 4 ) );
+
+ck( 'every form carries its own nonce and action',
+    array(
+        substr_count( $list, 'name="_wpnonce" value="wpcpm_question_move"' ),
+        substr_count( $list, 'name="_wpnonce" value="wpcpm_question_remove"' ),
+        substr_count( $list, 'name="_wpnonce" value="wpcpm_question_add"' ),
+        substr_count( $list, 'name="action" value="wpcpm_question_add"' ),
+    ),
+    array( 4, 4, 4, 4 ) );
+
+ck( 'the add form asks for the column, the words and one of the ten controls, and knows its group',
+    array(
+        substr_count( $list, 'name="wpcpm_column"' ),
+        substr_count( $list, 'id="wpcpm_add_label_' ),
+        substr_count( $list, '<select id="wpcpm_add_type_project" name="wpcpm_type">' ),
+        substr_count( $list, '<option value="team">Contribution team</option>' ),
+    ),
+    array( 4, 4, 1, 4 ) );
+
+ck( 'the list sits after the properties form, not inside it',
+    strpos( $list, '<div class="wpcpm-questions">' ) > strpos( $list, 'Save the track' ), true );
+
+$read_only_form = WPCPM_Track_Builder::form( 11 );
+ob_start();
+WPCPM_Track_Builder_Screen::render_form( array( 'form' => $read_only_form, 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => array() ) );
+$read_only_list = ob_get_clean();
+
+ck( 'a built-in track still shows its questions, with nothing to press and no Add',
+    array(
+        substr_count( $read_only_list, 'class="wpcpm-question"' ),
+        substr_count( $read_only_list, 'Edit</a>' ),
+        substr_count( $read_only_list, 'wpcpm-question__mover' ),
+        substr_count( $read_only_list, 'wpcpm-questions__add' ),
+        false !== strpos( $read_only_list, 'cannot be edited here' ),
+    ),
+    array( 2, 0, 0, 0, true ) );
+
+$GLOBALS['enqueued'] = array();
+$tool->enqueue_assets( 'wpcredits-program_page_wpcpm-tool-track-builder' );
+
+ck( 'the screen enqueues its stylesheet and the editor script, the script in the footer',
+    $GLOBALS['enqueued'],
+    array( array( 'style', 'wpcpm-track-builder', array( 'wpcpm-admin' ) ), array( 'script', 'wpcpm-track-editor', array(), true ) ) );
+
 printf( "\n%s (%d checks)\n", $fail ? sprintf( '%d FAILURE(S)', $fail ) : 'ALL PASS', $total );
 exit( $fail ? 1 : 0 );
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-track-builder.php`

Expected: `bin/test-track-builder.php` stops with `Fatal error: Uncaught Error: Failed opening required 'includes/tools/class-wpcpm-track-editor-screen.php'`. The screen class does not exist yet.

- [ ] **Step 3: Write the code**

```diff
diff --git a/assets/css/track-builder.css b/assets/css/track-builder.css
index c231ac0..5421416 100644
--- a/assets/css/track-builder.css
+++ b/assets/css/track-builder.css
@@ -85,3 +85,67 @@
 	display: inline-block;
 	margin: 2px 0;
 }
+
+/* The question editor (T3a). The list is core's own table shape, one table a group, so only what
+   the rows add is styled: the column name beside the words, the notice under them, and the arrows. */
+.wpcpm-questions__group {
+	margin-top: 24px;
+}
+
+.wpcpm-questions__group h2 {
+	margin-bottom: 8px;
+}
+
+/* The column name is what Airtable calls the question; set as code so a trailing space or an odd
+   capital reads as deliberate rather than as a typo in the words beside it. */
+.wpcpm-question__column {
+	display: block;
+	margin-top: 4px;
+}
+
+/* A question's notice - shared with the tracks it names, forked from a column, or a column
+   publishing will create - is context under the row's words, not a warning: the same muted
+   treatment the track list gives its equivalence line. */
+.wpcpm-question__notice {
+	display: block;
+	margin-top: 4px;
+	color: #50575e;
+	font-size: 12px;
+}
+
+/* The two arrows and Remove sit together on the right, the way the Student Report Card's module
+   arrows do; the mover is a form, so it is inline to keep them on one line. */
+.wpcpm-question__mover,
+.wpcpm-question__remover {
+	display: inline-block;
+	margin: 0 4px 0 0;
+}
+
+/* The add form is one row of inputs under its group's table, aligned to the table's left edge. */
+.wpcpm-questions__add {
+	margin: 8px 0 0;
+}
+
+.wpcpm-questions__add label {
+	margin-right: 8px;
+}
+
+/* The schema line stands above the whole list: a sentence, and the age of the reading after it in
+   the same muted color as a notice. */
+.wpcpm-questions__schema {
+	margin: 16px 0 0;
+}
+
+.wpcpm-questions__age {
+	color: #50575e;
+}
+
+/* On the question's own screen, the column and the control sit above the properties table, and a
+   locked column is drawn as text rather than a box so the lock is visible before a save refuses it. */
+.wpcpm-question__identity {
+	margin-bottom: 16px;
+}
+
+.wpcpm-question__locked {
+	color: #50575e;
+}
diff --git a/assets/js/track-editor.js b/assets/js/track-editor.js
new file mode 100644
index 0000000..0931ad7
--- /dev/null
+++ b/assets/js/track-editor.js
@@ -0,0 +1,250 @@
+/**
+ * The Track Builder's question list: a question moves the moment its arrow is pressed.
+ *
+ * Each row carries two arrows, a form that posts "move this question up or down" and comes back
+ * to the page. Without this file that round trip is the whole feature, and it works. With it the
+ * row moves in place the moment an arrow is pressed and the same form is posted in the background
+ * to remember the order (`assets/js/modules.js` is the pattern, and the reasons there hold here).
+ * The answer carries the order the server kept, and the page is put in that order.
+ *
+ * A move stays inside the question's group: the server swaps a question with its neighbor in the
+ * same group and nothing else, so the page does the same, and an arrow at the edge of its group
+ * is disabled rather than pressed into doing nothing.
+ *
+ * When the server refuses the move - a nonce that expired while the page sat open, or a track
+ * that can no longer be saved - the row goes back where it started and the live region says the
+ * move was not kept. A request that gets no usable answer keeps what is on screen; the next load
+ * shows what was kept.
+ */
+( function () {
+	'use strict';
+
+	document.addEventListener( 'DOMContentLoaded', function () {
+		var forms = Array.prototype.slice.call( document.querySelectorAll( '.wpcpm-question__mover' ) );
+
+		if ( ! forms.length || ! window.fetch || ! window.FormData ) {
+			return;
+		}
+
+		var list = document.querySelector( '.wpcpm-questions' );
+		var live = document.createElement( 'p' );
+		var sent = 0;
+
+		// The newest press that has been answered, and the order the server is known to hold.
+		var answered = 0;
+		var kept     = columns( rows() );
+
+		live.className = 'screen-reader-text';
+		live.setAttribute( 'aria-live', 'polite' );
+		list.parentNode.insertBefore( live, list );
+
+		/**
+		 * Every question row, in the order the page shows.
+		 *
+		 * @return {Element[]}
+		 */
+		function rows() {
+			return Array.prototype.slice.call( document.querySelectorAll( '.wpcpm-question' ) );
+		}
+
+		/**
+		 * The column each row in a list carries, verbatim.
+		 *
+		 * @param {Element[]} list Rows.
+		 * @return {string[]}
+		 */
+		function columns( list ) {
+			return list.map( function ( row ) {
+				return row.getAttribute( 'data-wpcpm-column' );
+			} );
+		}
+
+		/**
+		 * The rows of one group, in page order.
+		 *
+		 * @param {Element} row Any row of the group.
+		 * @return {Element[]}
+		 */
+		function peers( row ) {
+			var group = row.getAttribute( 'data-wpcpm-group' );
+
+			return rows().filter( function ( other ) {
+				return other.getAttribute( 'data-wpcpm-group' ) === group;
+			} );
+		}
+
+		/**
+		 * The first of a group cannot go up and the last cannot go down.
+		 */
+		function refresh() {
+			rows().forEach( function ( row ) {
+				var group = peers( row );
+				var i     = group.indexOf( row );
+				var up    = row.querySelector( '.wpcpm-question__move--up' );
+				var down  = row.querySelector( '.wpcpm-question__move--down' );
+
+				if ( up ) {
+					up.disabled = 0 === i;
+				}
+
+				if ( down ) {
+					down.disabled = i === group.length - 1;
+				}
+			} );
+		}
+
+		/**
+		 * Put the page in the order the server kept, touching nothing when it already is.
+		 *
+		 * @param {string[]}     order   Column names.
+		 * @param {Element|null} pressed The arrow the person pressed, when there was one.
+		 */
+		function arrange( order, pressed ) {
+			var current  = rows();
+			var focused  = document.activeElement;
+			var byColumn = {};
+			var parent;
+			var marker;
+
+			if ( ! current.length || columns( current ).join( ' ' ) === order.join( ' ' ) ) {
+				return;
+			}
+
+			if ( pressed && document.contains( pressed ) && mover( focused ) === mover( pressed ) ) {
+				focused = pressed;
+			}
+
+			parent = current[ 0 ].parentNode;
+			marker = document.createComment( 'wpcpm-questions' );
+			parent.insertBefore( marker, current[ 0 ] );
+
+			columns( current ).forEach( function ( column, i ) {
+				byColumn[ column ] = current[ i ];
+			} );
+
+			order.forEach( function ( column ) {
+				if ( byColumn[ column ] ) {
+					parent.insertBefore( byColumn[ column ], marker );
+				}
+			} );
+
+			parent.removeChild( marker );
+			refresh();
+			restore( focused );
+		}
+
+		/**
+		 * The mover an element sits in, or null.
+		 *
+		 * @param {Element|null} element Any element.
+		 * @return {Element|null}
+		 */
+		function mover( element ) {
+			return element && element.closest ? element.closest( '.wpcpm-question__mover' ) : null;
+		}
+
+		/**
+		 * Put focus back on the arrow that had it, or its neighbor when it went quiet.
+		 *
+		 * @param {Element|null} focused The control that had focus.
+		 */
+		function restore( focused ) {
+			var pair;
+
+			if ( ! focused || ! focused.focus || ! document.contains( focused ) ) {
+				return;
+			}
+
+			if ( focused.disabled ) {
+				pair    = mover( focused );
+				focused = ( pair && pair.querySelector( 'button:not([disabled])' ) ) || focused;
+			}
+
+			focused.focus();
+		}
+
+		refresh();
+
+		forms.forEach( function ( form ) {
+			form.addEventListener( 'submit', function ( event ) {
+				var button = event.submitter || document.activeElement;
+				var row    = form.closest( '.wpcpm-question' );
+				var group;
+				var index;
+				var direction;
+				var neighbor;
+				var data;
+				var ticket;
+
+				if ( ! row || ! button || 'BUTTON' !== button.tagName || ! form.contains( button ) ) {
+					return;
+				}
+
+				event.preventDefault();
+
+				group     = peers( row );
+				index     = group.indexOf( row );
+				direction = button.value;
+				neighbor  = 'up' === direction ? group[ index - 1 ] : group[ index + 1 ];
+
+				if ( ! neighbor ) {
+					return;
+				}
+
+				if ( 'up' === direction ) {
+					neighbor.parentNode.insertBefore( row, neighbor );
+				} else {
+					neighbor.parentNode.insertBefore( neighbor, row );
+				}
+
+				refresh();
+				( button.disabled ? form.querySelector( 'button:not([disabled])' ) || button : button ).focus();
+				live.textContent = button.getAttribute( 'data-wpcpm-moved' ) || '';
+
+				data = new FormData( form );
+				data.append( button.name, direction );
+				data.append( 'wpcpm_async', '1' );
+				ticket = ++sent;
+
+				// The attribute, not `form.action`: the hidden `action` field WordPress admin-post
+				// needs shadows that property with the input element itself.
+				fetch( form.getAttribute( 'action' ), {
+					method: 'POST',
+					body: data,
+					credentials: 'same-origin',
+					headers: { 'X-Requested-With': 'XMLHttpRequest' }
+				} )
+					.then( function ( response ) {
+						return response.ok ? response.json() : null;
+					} )
+					.then( function ( json ) {
+						var order = json && json.data && json.data.order;
+
+						// An answer older than one already handled says nothing.
+						if ( ticket <= answered ) {
+							return;
+						}
+
+						answered = ticket;
+
+						if ( Array.isArray( order ) ) {
+							kept = order;
+						} else {
+							// Refused: replace what the live region already said.
+							live.textContent = form.getAttribute( 'data-wpcpm-refused' ) || '';
+						}
+
+						// Only the newest press arranges the page.
+						if ( ticket !== sent ) {
+							return;
+						}
+
+						arrange( kept, button );
+					} )
+					.catch( function () {
+						// The page keeps the order on screen; the next load shows what was kept.
+					} );
+			} );
+		} );
+	} );
+}() );
diff --git a/includes/tools/class-wpcpm-track-builder-screen.php b/includes/tools/class-wpcpm-track-builder-screen.php
index e2b06b3..4f8af06 100644
--- a/includes/tools/class-wpcpm-track-builder-screen.php
+++ b/includes/tools/class-wpcpm-track-builder-screen.php
@@ -522,6 +522,9 @@ final class WPCPM_Track_Builder_Screen {
 		if ( ! empty( $form['read_only'] ) ) {
 			echo '<p class="wpcpm-tracks__readonly">' . esc_html__( 'This track runs from its hand-written form, so it cannot be edited here. Duplicate it to start a track of your own, or switch it to its definition first.', 'wpcredits-program-manager' ) . '</p>';
 
+			// The questions are still shown, with nothing to press: what a duplicate would copy.
+			self::render_questions( $form, $url );
+
 			return;
 		}
 
@@ -555,6 +558,27 @@ final class WPCPM_Track_Builder_Screen {
 
 		printf( '<p class="submit"><button type="submit" class="button button-primary">%s</button></p>', esc_html__( 'Save the track', 'wpcredits-program-manager' ) );
 		echo '</form>';
+
+		self::render_questions( $form, $url );
+	}
+
+	/**
+	 * The question list under the properties, drawn by the editor's own screen class.
+	 *
+	 * @param array  $form The track as `WPCPM_Track_Builder::form()` gives it.
+	 * @param string $url  The screen's URL.
+	 */
+	private static function render_questions( array $form, $url ) {
+		WPCPM_Track_Editor_Screen::render_questions(
+			array(
+				'track'     => isset( $form['id'] ) ? (int) $form['id'] : 0,
+				'key'       => isset( $form['key'] ) ? (string) $form['key'] : '',
+				'questions' => isset( $form['questions'] ) && is_array( $form['questions'] ) ? $form['questions'] : array(),
+				'others'    => isset( $form['others'] ) && is_array( $form['others'] ) ? $form['others'] : array(),
+				'url'       => $url,
+				'read_only' => ! empty( $form['read_only'] ),
+			)
+		);
 	}
 
 	/**
diff --git a/includes/tools/class-wpcpm-track-builder.php b/includes/tools/class-wpcpm-track-builder.php
index 3eddb25..af97a0f 100644
--- a/includes/tools/class-wpcpm-track-builder.php
+++ b/includes/tools/class-wpcpm-track-builder.php
@@ -152,6 +152,10 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 		}
 
 		wp_enqueue_style( 'wpcpm-track-builder', WPCPM_PLUGIN_URL . 'assets/css/track-builder.css', array( 'wpcpm-admin' ), WPCPM_VERSION );
+
+		// The question list's arrows move a row in place and post in the background; without the
+		// script the same forms post the ordinary way (the design's section 6).
+		wp_enqueue_script( 'wpcpm-track-editor', WPCPM_PLUGIN_URL . 'assets/js/track-editor.js', array(), WPCPM_VERSION, true );
 	}
 
 	/**
@@ -236,6 +240,10 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 			'hours_target'    => isset( $definition['hours_target'] ) ? (int) $definition['hours_target'] : '',
 			'hue'             => isset( $definition['hue'] ) ? (string) $definition['hue'] : '',
 			'read_only'       => 'builtin' === WPCPM_Track_Store::source( $post_id ),
+			// The questions and every other track's columns, for the list under the properties
+			// (T3a): the sharing index is read once here, not once per row.
+			'questions'       => isset( $definition['questions'] ) && is_array( $definition['questions'] ) ? $definition['questions'] : array(),
+			'others'          => WPCPM_Track_Store::others( $post_id ),
 		);
 	}
 
diff --git a/includes/tools/class-wpcpm-track-editor-screen.php b/includes/tools/class-wpcpm-track-editor-screen.php
new file mode 100644
index 0000000..93cee88
--- /dev/null
+++ b/includes/tools/class-wpcpm-track-editor-screen.php
@@ -0,0 +1,290 @@
+<?php
+/**
+ * Tools - the Track Builder's question editor: what it draws.
+ *
+ * @package WPCreditsProgramManager
+ */
+
+if ( ! defined( 'ABSPATH' ) ) {
+	exit;
+}
+
+/**
+ * The question list under a track's properties, and the screen one question is edited on.
+ *
+ * Markup only: every fact it prints arrives in `$args`, gathered by `WPCPM_Track_Builder`, so this
+ * class can be held to what it draws with the collaborators stood in (the pattern of
+ * `WPCPM_Track_Builder_Screen`). The list is one table a group, in the order the Student Report
+ * Card draws them, and each row carries its column name verbatim in a data attribute, which is
+ * what `assets/js/track-editor.js` moves rows by.
+ */
+class WPCPM_Track_Editor_Screen {
+
+	/**
+	 * The four groups, in the order the Student Report Card draws them.
+	 *
+	 * The same four labels as `WPCPM_Student_Report_Form::groups()`, repeated here rather than
+	 * read from it so the editor's suite needs no report form: the keys are the definition's
+	 * `GROUPS`, and a fifth group would have to be added to both, which `validate()` would say.
+	 *
+	 * @return array<string,string>
+	 */
+	public static function groups() {
+		return array(
+			'hours'      => __( 'Total hours', 'wpcredits-program-manager' ),
+			'onboarding' => __( 'Onboarding', 'wpcredits-program-manager' ),
+			'project'    => __( 'Project', 'wpcredits-program-manager' ),
+			'wrapup'     => __( 'Wrap-up', 'wpcredits-program-manager' ),
+		);
+	}
+
+	/**
+	 * The ten controls, named for the person choosing one.
+	 *
+	 * @return array<string,string>
+	 */
+	public static function controls() {
+		return array(
+			'text'     => __( 'Text, one line', 'wpcredits-program-manager' ),
+			'textarea' => __( 'Text, many lines', 'wpcredits-program-manager' ),
+			'richtext' => __( 'Rich text', 'wpcredits-program-manager' ),
+			'url'      => __( 'Web address', 'wpcredits-program-manager' ),
+			'email'    => __( 'Email address', 'wpcredits-program-manager' ),
+			'number'   => __( 'Number', 'wpcredits-program-manager' ),
+			'checkbox' => __( 'Checkbox', 'wpcredits-program-manager' ),
+			'select'   => __( 'One choice of several', 'wpcredits-program-manager' ),
+			'image'    => __( 'Screenshot', 'wpcredits-program-manager' ),
+			'team'     => __( 'Contribution team', 'wpcredits-program-manager' ),
+		);
+	}
+
+	/**
+	 * The questions of a track, by group, with what can be done to each.
+	 *
+	 * @param array $args `track` (the post ID), `key`, `questions` (column => spec, in order),
+	 *                    `others` (every other track as `WPCPM_Track_Store::others()` gives them),
+	 *                    the screen's `url`, and `read_only` for a built-in track its PHP still runs.
+	 */
+	public static function render_questions( array $args ) {
+		$track     = isset( $args['track'] ) ? (int) $args['track'] : 0;
+		$key       = isset( $args['key'] ) ? (string) $args['key'] : '';
+		$questions = isset( $args['questions'] ) && is_array( $args['questions'] ) ? $args['questions'] : array();
+		$others    = isset( $args['others'] ) && is_array( $args['others'] ) ? $args['others'] : array();
+		$url       = isset( $args['url'] ) ? (string) $args['url'] : '';
+		$read_only = ! empty( $args['read_only'] );
+
+		echo '<div class="wpcpm-questions">';
+		echo '<h2 class="wpcpm-questions__heading">' . esc_html__( 'Questions', 'wpcredits-program-manager' ) . '</h2>';
+
+		foreach ( self::groups() as $group => $heading ) {
+			printf( '<section class="wpcpm-questions__group" id="wpcpm-questions-%s">', esc_attr( $group ) );
+			printf( '<h3>%s</h3>', esc_html( $heading ) );
+
+			$rows = array();
+
+			foreach ( $questions as $column => $spec ) {
+				if ( is_array( $spec ) && isset( $spec['group'] ) && (string) $spec['group'] === $group ) {
+					$rows[ (string) $column ] = $spec;
+				}
+			}
+
+			if ( array() === $rows ) {
+				echo '<p class="wpcpm-questions__empty">' . esc_html__( 'No questions in this group.', 'wpcredits-program-manager' ) . '</p>';
+			} else {
+				echo '<table class="widefat striped wpcpm-questions__table"><thead><tr>';
+
+				foreach ( array(
+					__( 'Question', 'wpcredits-program-manager' ),
+					__( 'Control', 'wpcredits-program-manager' ),
+					__( 'Actions', 'wpcredits-program-manager' ),
+				) as $column_heading ) {
+					echo '<th scope="col">' . esc_html( $column_heading ) . '</th>';
+				}
+
+				echo '</tr></thead><tbody>';
+
+				foreach ( $rows as $column => $spec ) {
+					self::render_row( $track, $key, $column, $spec, $others, $url, $read_only );
+				}
+
+				echo '</tbody></table>';
+			}
+
+			if ( ! $read_only ) {
+				self::render_add( $track, $group );
+			}
+
+			echo '</section>';
+		}
+
+		echo '</div>';
+	}
+
+	/**
+	 * One question's row.
+	 *
+	 * @param int    $track     The post ID.
+	 * @param string $key       The track's key.
+	 * @param string $column    The column, verbatim.
+	 * @param array  $spec      The question.
+	 * @param array  $others    Every other track.
+	 * @param string $url       The screen's URL.
+	 * @param bool   $read_only Whether the row offers nothing to press.
+	 */
+	private static function render_row( $track, $key, $column, array $spec, array $others, $url, $read_only ) {
+		$controls = self::controls();
+		$type     = isset( $spec['type'] ) ? (string) $spec['type'] : '';
+		$group    = isset( $spec['group'] ) ? (string) $spec['group'] : '';
+
+		printf(
+			'<tr class="wpcpm-question" id="wpcpm-question-%1$s" data-wpcpm-column="%2$s" data-wpcpm-group="%3$s">',
+			esc_attr( md5( $column ) ),
+			esc_attr( $column ),
+			esc_attr( $group )
+		);
+
+		printf( '<td><strong>%s</strong>', esc_html( isset( $spec['label'] ) ? (string) $spec['label'] : '' ) );
+		printf( '<code class="wpcpm-question__column">%s</code>', esc_html( $column ) );
+		self::render_notice( $column, $key, $others );
+		echo '</td>';
+
+		printf( '<td>%s</td>', esc_html( isset( $controls[ $type ] ) ? $controls[ $type ] : $type ) );
+
+		echo '<td class="wpcpm-list__actions">';
+
+		if ( ! $read_only ) {
+			printf(
+				'<a href="%1$s">%2$s</a> ',
+				esc_url( add_query_arg( 'wpcpm_question', $column, add_query_arg( 'wpcpm_track', $track, $url ) ) ),
+				esc_html__( 'Edit', 'wpcredits-program-manager' )
+			);
+			self::render_mover( $track, $column );
+			self::render_remover( $track, $column );
+		}
+
+		echo '</td></tr>';
+	}
+
+	/**
+	 * What a row says under its words: who else writes the column, or what it forked from.
+	 *
+	 * @param string $column The column.
+	 * @param string $key    The track's key.
+	 * @param array  $others Every other track.
+	 */
+	private static function render_notice( $column, $key, array $others ) {
+		$owners = WPCPM_Track_Questions::owners( $column, $others );
+
+		if ( array() !== $owners ) {
+			$names = array();
+
+			foreach ( $owners as $owner ) {
+				$names[] = $owner['published']
+					? $owner['label']
+					/* translators: %s: a track's name. */
+					: sprintf( __( '%s (a draft)', 'wpcredits-program-manager' ), $owner['label'] );
+			}
+
+			$notice = sprintf(
+				/* translators: %s: the names of the other tracks writing this column. */
+				__( 'Shared with %s. Rewording keeps the column; a different control or different choices gives this track a column of its own.', 'wpcredits-program-manager' ),
+				implode( ', ', $names )
+			);
+
+			printf( '<span class="wpcpm-question__notice wpcpm-question__notice--shared">%s</span>', esc_html( $notice ) );
+
+			return;
+		}
+
+		$from = WPCPM_Track_Questions::forked_from( $column, $key, $others );
+
+		if ( '' !== $from ) {
+			$notice = sprintf(
+				/* translators: %s: the column this question forked from. */
+				__( 'A column of this track\'s own, forked from %s.', 'wpcredits-program-manager' ),
+				$from
+			);
+
+			printf( '<span class="wpcpm-question__notice wpcpm-question__notice--forked">%s</span>', esc_html( $notice ) );
+		}
+	}
+
+	/**
+	 * The two arrows: a form the page posts in the background, or the ordinary way without the script.
+	 *
+	 * @param int    $track  The post ID.
+	 * @param string $column The column.
+	 */
+	private static function render_mover( $track, $column ) {
+		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="wpcpm-question__mover" data-wpcpm-refused="' . esc_attr__( 'The move was not saved. The question is back where it was.', 'wpcredits-program-manager' ) . '">';
+		wp_nonce_field( WPCPM_Track_Editor::ACTION_MOVE );
+		echo '<input type="hidden" name="action" value="' . esc_attr( WPCPM_Track_Editor::ACTION_MOVE ) . '" />';
+		printf( '<input type="hidden" name="track" value="%d" />', (int) $track );
+		printf( '<input type="hidden" name="wpcpm_question" value="%s" />', esc_attr( $column ) );
+		printf(
+			'<button type="submit" class="button button-small wpcpm-question__move wpcpm-question__move--up" name="wpcpm_direction" value="up" aria-label="%1$s" data-wpcpm-moved="%2$s">&uarr;</button> ',
+			esc_attr__( 'Move up', 'wpcredits-program-manager' ),
+			esc_attr__( 'Moved up.', 'wpcredits-program-manager' )
+		);
+		printf(
+			'<button type="submit" class="button button-small wpcpm-question__move wpcpm-question__move--down" name="wpcpm_direction" value="down" aria-label="%1$s" data-wpcpm-moved="%2$s">&darr;</button>',
+			esc_attr__( 'Move down', 'wpcredits-program-manager' ),
+			esc_attr__( 'Moved down.', 'wpcredits-program-manager' )
+		);
+		echo '</form> ';
+	}
+
+	/**
+	 * Remove, with the confirmation saying what stays in Airtable (decision 9).
+	 *
+	 * @param int    $track  The post ID.
+	 * @param string $column The column.
+	 */
+	private static function render_remover( $track, $column ) {
+		printf(
+			'<form method="post" action="%1$s" class="wpcpm-question__remover" onsubmit="return confirm(\'%2$s\');">',
+			esc_url( admin_url( 'admin-post.php' ) ),
+			esc_js( __( 'Remove this question from the track? Its column, and whatever students wrote in it, stay in Airtable.', 'wpcredits-program-manager' ) )
+		);
+		wp_nonce_field( WPCPM_Track_Editor::ACTION_REMOVE );
+		echo '<input type="hidden" name="action" value="' . esc_attr( WPCPM_Track_Editor::ACTION_REMOVE ) . '" />';
+		printf( '<input type="hidden" name="track" value="%d" />', (int) $track );
+		printf( '<input type="hidden" name="wpcpm_question" value="%s" />', esc_attr( $column ) );
+		printf( '<button type="submit" class="button button-small button-link-delete">%s</button>', esc_html__( 'Remove', 'wpcredits-program-manager' ) );
+		echo '</form>';
+	}
+
+	/**
+	 * Add a question to this group: the column, the words, and the control.
+	 *
+	 * @param int    $track The post ID.
+	 * @param string $group The group.
+	 */
+	private static function render_add( $track, $group ) {
+		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="wpcpm-questions__add">';
+		wp_nonce_field( WPCPM_Track_Editor::ACTION_ADD );
+		echo '<input type="hidden" name="action" value="' . esc_attr( WPCPM_Track_Editor::ACTION_ADD ) . '" />';
+		printf( '<input type="hidden" name="track" value="%d" />', (int) $track );
+		printf( '<input type="hidden" name="wpcpm_group" value="%s" />', esc_attr( $group ) );
+
+		printf(
+			'<label for="wpcpm_add_column_%1$s">%2$s</label> <input type="text" class="regular-text" id="wpcpm_add_column_%1$s" name="wpcpm_column" /> ',
+			esc_attr( $group ),
+			esc_html__( 'Airtable column', 'wpcredits-program-manager' )
+		);
+		printf(
+			'<label for="wpcpm_add_label_%1$s">%2$s</label> <input type="text" class="regular-text" id="wpcpm_add_label_%1$s" name="wpcpm_label" /> ',
+			esc_attr( $group ),
+			esc_html__( 'What the student reads', 'wpcredits-program-manager' )
+		);
+		printf( '<label for="wpcpm_add_type_%1$s">%2$s</label> <select id="wpcpm_add_type_%1$s" name="wpcpm_type">', esc_attr( $group ), esc_html__( 'Control', 'wpcredits-program-manager' ) );
+
+		foreach ( self::controls() as $type => $name ) {
+			printf( '<option value="%1$s">%2$s</option>', esc_attr( $type ), esc_html( $name ) );
+		}
+
+		echo '</select> ';
+		printf( '<button type="submit" class="button">%s</button>', esc_html__( 'Add a question', 'wpcredits-program-manager' ) );
+		echo '</form>';
+	}
+}
diff --git a/uninstall.php b/uninstall.php
index 9fa658e..7811407 100644
--- a/uninstall.php
+++ b/uninstall.php
@@ -151,6 +151,7 @@ require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-duplicate
 require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-duplicate-finder.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-track-builder-screen.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-track-builder.php';
+require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-track-editor-screen.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/tools/class-wpcpm-track-editor.php';
 require_once plugin_dir_path( __FILE__ ) . 'includes/class-wpcpm-tools.php';
 
diff --git a/wpcredits-program-manager.php b/wpcredits-program-manager.php
index fc3f1ed..f6d4cbe 100644
--- a/wpcredits-program-manager.php
+++ b/wpcredits-program-manager.php
@@ -145,6 +145,7 @@ require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-duplicate-finder-scr
 require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-duplicate-finder.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-track-builder-screen.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-track-builder.php';
+require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-track-editor-screen.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/tools/class-wpcpm-track-editor.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/class-wpcpm-tools.php';
 require_once WPCPM_PLUGIN_DIR . 'includes/class-wpcpm-dashboards.php';
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-track-builder.php`

Expected: `bin/test-track-builder.php` ends `ALL PASS (135 checks)`. `php bin/test-roles.php` ends `ALL PASS` as well, and `node -e "new Function(require('fs').readFileSync('assets/js/track-editor.js','utf8'))"` prints nothing.

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-track-builder.php includes/tools/class-wpcpm-track-editor-screen.php includes/tools/class-wpcpm-track-builder.php includes/tools/class-wpcpm-track-builder-screen.php assets/js/track-editor.js assets/css/track-builder.css wpcredits-program-manager.php uninstall.php
git commit -m "Track Builder T3a: the question list under a track's properties"
```

---

### Task 7: One question on a screen of its own

**Files:**
- Modify: `includes/tools/class-wpcpm-track-builder.php` (`question_form()`, and the route in `render_admin_page()`)
- Modify: `includes/tools/class-wpcpm-track-editor-screen.php` (`render_question()` and its helpers)
- Test: `bin/test-track-builder.php`

**Interfaces:**
- Consumes: Task 1's `owners()`, `forked_from()` and `locked()`; Task 4's `others()`; Task 5's `ACTION_SAVE` and `WPCPM_Request::exact()`; Task 6's `groups()` and `controls()`.
- Produces: `WPCPM_Track_Builder::question_form( $post_id, $column ): array|null` with `track`, `label`, `key`, `column`, `question`, `owners`, `forked_from`, `locked` and `read_only`; the route `?wpcpm_track=<id>&wpcpm_question=<column>` (the column read with `exact()`, so a trailing space survives), falling through to the track's own page when the question is not on it; `WPCPM_Track_Editor_Screen::render_question( array $args )` with `form`, `url` and `flash`.

Decision 22. The column and the control at the top with the sharing and fork notices beside them, then the properties that apply: every question has its words, group, help, lead, subgroup, note, row, the three flags and the developer note; a number its bounds; text its length limit; a text area monospace; a select its choices, one a line. Which control's boxes are drawn follows what was last typed when a refusal brought the page back, so changing the control to one that needs more is a two-step (what this plan decides, 5). A published question's column and control are drawn as text with the same values posted hidden, so the lock is visible before a save would refuse it, and an email question's institution box comes ticked because `normalize()` sets it regardless.

`render_question()` goes before `render_questions()` in the class, with `render_identity_notices()`, `render_text_row()`, `render_flag_row()` and `render_flash()` after it. Every `sprintf()` that feeds `esc_html()` goes into a variable first: `esc_html( sprintf( ... ) )` spread over lines is a standards error.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-track-builder.php b/bin/test-track-builder.php
index 8a504cd..5eb7f66 100644
--- a/bin/test-track-builder.php
+++ b/bin/test-track-builder.php
@@ -23,6 +23,7 @@ define( 'WPCPM_VERSION', 'test' );
 function __( $s, $d = null ) { return $s; }
 function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
 function esc_attr( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
+function esc_textarea( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
 function esc_url( $s ) { return (string) $s; }
 function esc_url_raw( $s ) { return (string) $s; }
 function esc_html__( $s, $d = null ) { return esc_html( $s ); }
@@ -1456,5 +1457,173 @@ ck( 'the screen enqueues its stylesheet and the editor script, the script in the
     $GLOBALS['enqueued'],
     array( array( 'style', 'wpcpm-track-builder', array( 'wpcpm-admin' ) ), array( 'script', 'wpcpm-track-editor', array(), true ) ) );
 
+
+echo "\n=== One question on a screen of its own ===\n";
+
+WPCPM_Track_Store::$tracks = array(
+	13 => editable_track(),
+	11 => array(
+		'definition'  => array( 'key' => '150h', 'status' => 'In Sensei', 'label' => '150-hour Track', 'questions' => array( 'Hours' => array( 'type' => 'number', 'label' => 'Hours', 'group' => 'hours' ), 'Slack name' => array( 'type' => 'text', 'label' => 'Slack', 'group' => 'onboarding' ) ) ),
+		'state'       => 'published',
+		'source'      => 'builtin',
+		'log'         => array( array( 'at' => 1788000000, 'by' => 7, 'did' => 'publish' ) ),
+		'equivalence' => array(),
+		'published'   => array( 'key' => '150h' ),
+	),
+);
+WPCPM_Track_Store::$tracks[13]['definition']['questions']['Slack name - marketing'] = array( 'type' => 'textarea', 'label' => 'At length', 'group' => 'onboarding', 'mono' => true );
+WPCPM_Track_Store::$tracks[13]['definition']['questions']['Company ']               = array( 'type' => 'text', 'label' => 'Where you work', 'group' => 'onboarding' );
+
+$one = WPCPM_Track_Builder::question_form( 13, 'Slack name' );
+
+ck( 'question_form() gathers the question, who else writes its column, and that nothing locks it',
+    array( $one['track'], $one['label'], $one['key'], $one['column'], $one['question']['label'], array_column( $one['owners'], 'label' ), $one['forked_from'], $one['locked'], $one['read_only'] ),
+    array( 13, 'Marketing Track', 'marketing', 'Slack name', 'Your Slack name', array( '150-hour Track' ), '', false, false ) );
+
+ck( 'a fork names what it came from, and is shared with nobody',
+    array( WPCPM_Track_Builder::question_form( 13, 'Slack name - marketing' )['forked_from'], WPCPM_Track_Builder::question_form( 13, 'Slack name - marketing' )['owners'] ),
+    array( 'Slack name', array() ) );
+
+ck( 'a column with a trailing space is found exactly, and the trimmed name is not',
+    array( is_array( WPCPM_Track_Builder::question_form( 13, 'Company ' ) ), WPCPM_Track_Builder::question_form( 13, 'Company' ) ),
+    array( true, null ) );
+
+ck( 'a question that is not on the track, or a track that does not exist, is null',
+    array( WPCPM_Track_Builder::question_form( 13, 'Nothing' ), WPCPM_Track_Builder::question_form( 404, 'Hours' ) ),
+    array( null, null ) );
+
+WPCPM_Track_Store::$tracks[13]['published'] = array( 'questions' => array( 'Slack name' => array() ) );
+
+ck( 'a question in the published copy is locked, one added since is not',
+    array( WPCPM_Track_Builder::question_form( 13, 'Slack name' )['locked'], WPCPM_Track_Builder::question_form( 13, 'Your blog' )['locked'] ),
+    array( true, false ) );
+
+WPCPM_Track_Store::$tracks[13]['published'] = null;
+
+$_GET = array( 'wpcpm_track' => 13, 'wpcpm_question' => 'Slack name' );
+ob_start();
+$tool->render_admin_page();
+$routed = ob_get_clean();
+$_GET = array( 'wpcpm_track' => 13, 'wpcpm_question' => 'Nothing' );
+ob_start();
+$tool->render_admin_page();
+$fallen = ob_get_clean();
+$_GET = array();
+
+ck( 'the screen routes to the question the URL names, and falls back to the track when it names none it has',
+    array(
+        false !== strpos( $routed, 'class="wpcpm-question-form"' ), false === strpos( $routed, 'Save the track' ),
+        false === strpos( $fallen, 'class="wpcpm-question-form"' ), false !== strpos( $fallen, 'Save the track' ),
+    ),
+    array( true, true, true, true ) );
+
+/**
+ * Draw one question's screen.
+ *
+ * @param array $form  From `question_form()`.
+ * @param array $flash What the last press left.
+ * @return string
+ */
+function question_screen( $form, array $flash = array() ) {
+	ob_start();
+	WPCPM_Track_Editor_Screen::render_question( array( 'form' => $form, 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => $flash ) );
+
+	return ob_get_clean();
+}
+
+$screen = question_screen( WPCPM_Track_Builder::question_form( 13, 'Slack name' ) );
+
+ck( 'the way back names the track, and the form posts the save action for this question',
+    array(
+        false !== strpos( $screen, 'wpcpm_track=13">Back to Marketing Track</a>' ),
+        substr_count( $screen, 'name="_wpnonce" value="wpcpm_question_save"' ),
+        substr_count( $screen, 'name="action" value="wpcpm_question_save"' ),
+        substr_count( $screen, '<input type="hidden" name="track" value="13" />' ),
+        substr_count( $screen, '<input type="hidden" name="wpcpm_question" value="Slack name" />' ),
+    ),
+    array( true, 1, 1, 1, 1 ) );
+
+ck( 'the column is a box and the control a select with the current one chosen, and the sharing notice sits beside them',
+    array(
+        false !== strpos( $screen, 'id="wpcpm_column" name="wpcpm_column" value="Slack name"' ),
+        false !== strpos( $screen, '<option value="text" selected="selected">Text, one line</option>' ),
+        substr_count( $screen, 'selected="selected"' ),
+        false !== strpos( $screen, 'This column is shared with 150-hour Track.' ),
+    ),
+    array( true, true, 2, true ) );
+
+ck( 'every property a question has is a row: words, group with its own chosen, help, lead, subheading, note, row, three flags and the developer note',
+    array(
+        false !== strpos( $screen, 'id="wpcpm_label" name="wpcpm_label" value="Your Slack name"' ),
+        false !== strpos( $screen, '<option value="onboarding" selected="selected">Onboarding</option>' ),
+        substr_count( $screen, 'name="wpcpm_help"' ) + substr_count( $screen, 'name="wpcpm_lead"' ) + substr_count( $screen, 'name="wpcpm_subgroup"' ) + substr_count( $screen, 'name="wpcpm_note"' ) + substr_count( $screen, 'name="wpcpm_row"' ) + substr_count( $screen, 'name="wpcpm_why"' ),
+        substr_count( $screen, 'type="checkbox" id="wpcpm_stack"' ) + substr_count( $screen, 'type="checkbox" id="wpcpm_required"' ) + substr_count( $screen, 'type="checkbox" id="wpcpm_hide_from_institution"' ),
+        substr_count( $screen, 'checked="checked"' ),
+    ),
+    array( true, true, 6, 3, 0 ) );
+
+ck( 'a single-line text box offers its length limit and nothing another control owns',
+    array( substr_count( $screen, 'name="wpcpm_maxlength"' ), substr_count( $screen, 'name="wpcpm_min"' ), substr_count( $screen, 'name="wpcpm_options"' ), substr_count( $screen, 'id="wpcpm_mono"' ), false !== strpos( $screen, 'Save the question' ) ),
+    array( 1, 0, 0, 0, true ) );
+
+$number = question_screen( WPCPM_Track_Builder::question_form( 13, 'Hours' ) );
+
+ck( 'a number offers its bounds, filled from the question, and no length limit',
+    array(
+        false !== strpos( $number, 'id="wpcpm_min" name="wpcpm_min" value="0"' ),
+        false !== strpos( $number, 'id="wpcpm_max" name="wpcpm_max" value="1000"' ),
+        false !== strpos( $number, 'id="wpcpm_step" name="wpcpm_step" value="1"' ),
+        substr_count( $number, 'name="wpcpm_maxlength"' ),
+    ),
+    array( true, true, true, 0 ) );
+
+$mono = question_screen( WPCPM_Track_Builder::question_form( 13, 'Slack name - marketing' ) );
+
+ck( 'a text area offers monospace, ticked when set, and says what it forked from',
+    array( false !== strpos( $mono, 'type="checkbox" id="wpcpm_mono" name="wpcpm_mono" value="1" checked="checked"' ), false !== strpos( $mono, 'forked from Slack name.' ) ),
+    array( true, true ) );
+
+$typed = question_screen(
+	WPCPM_Track_Builder::question_form( 13, 'Your blog' ),
+	array( 'status' => 'error', 'message' => 'A select needs its choices.', 'values' => array( 'column' => 'Your blog', 'type' => 'select', 'label' => 'Your blog', 'group' => 'wrapup', 'options' => array( 'Yes', 'No & maybe' ) ) )
+);
+
+ck( 'after a refusal what was typed wins, box by box: the new control\'s rows are drawn, its choices one a line and encoded, the group as typed, and the refusal is shown',
+    array(
+        false !== strpos( $typed, '<option value="select" selected="selected">One choice of several</option>' ),
+        false !== strpos( $typed, "<textarea id=\"wpcpm_options\" name=\"wpcpm_options\" rows=\"6\" class=\"large-text code\">Yes\nNo &amp; maybe</textarea>" ),
+        false !== strpos( $typed, '<option value="wrapup" selected="selected">Wrap-up</option>' ),
+        false !== strpos( $typed, '<div class="notice notice-error is-dismissible"><p>A select needs its choices.</p></div>' ),
+    ),
+    array( true, true, true, true ) );
+
+WPCPM_Track_Store::$tracks[13]['definition']['questions']['Personal email'] = array( 'type' => 'email', 'label' => 'An address of your own', 'group' => 'wrapup' );
+$email = question_screen( WPCPM_Track_Builder::question_form( 13, 'Personal email' ) );
+
+ck( 'an email question is always kept off the institution, so that box comes ticked',
+    false !== strpos( $email, 'id="wpcpm_hide_from_institution" name="wpcpm_hide_from_institution" value="1" checked="checked"' ), true );
+
+WPCPM_Track_Store::$tracks[13]['published'] = array( 'questions' => array( 'Slack name' => array() ) );
+$locked = question_screen( WPCPM_Track_Builder::question_form( 13, 'Slack name' ) );
+WPCPM_Track_Store::$tracks[13]['published'] = null;
+
+ck( 'a published question shows its column and control as text, posts them hidden, and says why they are fixed',
+    array(
+        substr_count( $locked, 'id="wpcpm_column"' ),
+        substr_count( $locked, '<select id="wpcpm_type"' ),
+        false !== strpos( $locked, '<input type="hidden" name="wpcpm_column" value="Slack name" />' ),
+        false !== strpos( $locked, '<input type="hidden" name="wpcpm_type" value="text" />' ),
+        false !== strpos( $locked, '<code>Slack name</code>' ),
+        false !== strpos( $locked, 'remove it and add a new question with a column of its own' ),
+        false !== strpos( $locked, 'id="wpcpm_label" name="wpcpm_label" value="Your Slack name"' ),
+    ),
+    array( 0, 0, true, true, true, true, true ) );
+
+$read_only = question_screen( WPCPM_Track_Builder::question_form( 11, 'Hours' ) );
+
+ck( 'a built-in track\'s question has no form at all, and points at Duplicate',
+    array( substr_count( $read_only, '<form' ), false !== strpos( $read_only, 'Duplicate the track to start one of your own' ) ),
+    array( 0, true ) );
+
 printf( "\n%s (%d checks)\n", $fail ? sprintf( '%d FAILURE(S)', $fail ) : 'ALL PASS', $total );
 exit( $fail ? 1 : 0 );
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-track-builder.php`

Expected: `bin/test-track-builder.php` stops with `Fatal error: Uncaught Error: Call to undefined method WPCPM_Track_Builder::question_form()`. `question_form()` does not exist yet.

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/tools/class-wpcpm-track-builder.php b/includes/tools/class-wpcpm-track-builder.php
index af97a0f..69f8229 100644
--- a/includes/tools/class-wpcpm-track-builder.php
+++ b/includes/tools/class-wpcpm-track-builder.php
@@ -271,7 +271,50 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 	}
 
 	/**
-	 * Render the screen: a copy being started, one track's properties, or the list.
+	 * One question, with everything its screen says about it.
+	 *
+	 * The sharing index, the fork it came from and the lock are read here, once, so the screen
+	 * prints facts and decides nothing: `WPCPM_Track_Questions` answers each of the three from the
+	 * same inputs the handler will use when Save is pressed.
+	 *
+	 * @param int    $post_id The track.
+	 * @param string $column  The question's column, exactly as the URL carries it.
+	 * @return array|null Null when the track or the question does not exist.
+	 */
+	public static function question_form( $post_id, $column ) {
+		$post_id    = (int) $post_id;
+		$column     = (string) $column;
+		$definition = WPCPM_Track_Store::get( $post_id );
+
+		if ( ! is_array( $definition ) ) {
+			return null;
+		}
+
+		$questions = isset( $definition['questions'] ) && is_array( $definition['questions'] ) ? $definition['questions'] : array();
+
+		if ( ! array_key_exists( $column, $questions ) || ! is_array( $questions[ $column ] ) ) {
+			return null;
+		}
+
+		$key       = isset( $definition['key'] ) ? (string) $definition['key'] : '';
+		$published = WPCPM_Track_Store::published( $post_id );
+		$others    = WPCPM_Track_Store::others( $post_id );
+
+		return array(
+			'track'       => $post_id,
+			'label'       => isset( $definition['label'] ) ? (string) $definition['label'] : '',
+			'key'         => $key,
+			'column'      => $column,
+			'question'    => $questions[ $column ],
+			'owners'      => WPCPM_Track_Questions::owners( $column, $others ),
+			'forked_from' => WPCPM_Track_Questions::forked_from( $column, $key, $others ),
+			'locked'      => WPCPM_Track_Questions::locked( $column, is_array( $published ) && isset( $published['questions'] ) && is_array( $published['questions'] ) ? $published['questions'] : array() ),
+			'read_only'   => 'builtin' === WPCPM_Track_Store::source( $post_id ),
+		);
+	}
+
+	/**
+	 * Render the screen: a copy being started, one question, one track's properties, or the list.
 	 */
 	public function render_admin_page() {
 		$this->require_manager();
@@ -320,6 +363,26 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 			return;
 		}
 
+		$question = WPCPM_Request::exact( 'wpcpm_question' );
+
+		if ( $track > 0 && '' !== $question ) {
+			$form = self::question_form( $track, $question );
+
+			if ( is_array( $form ) ) {
+				WPCPM_Track_Editor_Screen::render_question(
+					array(
+						'form'  => $form,
+						'url'   => $this->admin_url(),
+						'flash' => $flash,
+					)
+				);
+
+				echo '</div>';
+
+				return;
+			}
+		}
+
 		if ( $track > 0 && is_array( WPCPM_Track_Store::get( $track ) ) ) {
 			WPCPM_Track_Builder_Screen::render_form(
 				array(
diff --git a/includes/tools/class-wpcpm-track-editor-screen.php b/includes/tools/class-wpcpm-track-editor-screen.php
index 93cee88..38a42a1 100644
--- a/includes/tools/class-wpcpm-track-editor-screen.php
+++ b/includes/tools/class-wpcpm-track-editor-screen.php
@@ -58,6 +58,239 @@ class WPCPM_Track_Editor_Screen {
 		);
 	}
 
+	/**
+	 * One question on a page of its own (the design's decision 22).
+	 *
+	 * The column and the control at the top with the fork and sharing notices beside them, then
+	 * the properties that apply to the control: every question has its words, group, help, lead,
+	 * subgroup, note, row, stack, required, hide from institution and why; a number also its
+	 * bounds, text its length limit, a text area mono, a select its choices. Which control's boxes
+	 * are drawn follows what was last typed when a refusal brought the page back, so changing the
+	 * control to one that needs more is a two-step: choose it, save, fill in what the refusal
+	 * names, save. A published question's column and control are drawn as text with the same
+	 * values posted hidden, so the lock is visible before a save would refuse it (decision 23).
+	 *
+	 * @param array $args `form` from `WPCPM_Track_Builder::question_form()`, the screen's `url`,
+	 *                    and the `flash` the last press left.
+	 */
+	public static function render_question( array $args ) {
+		$form     = isset( $args['form'] ) && is_array( $args['form'] ) ? $args['form'] : array();
+		$url      = isset( $args['url'] ) ? (string) $args['url'] : '';
+		$flash    = isset( $args['flash'] ) && is_array( $args['flash'] ) ? $args['flash'] : array();
+		$typed    = isset( $flash['values'] ) && is_array( $flash['values'] ) ? $flash['values'] : array();
+		$track    = isset( $form['track'] ) ? (int) $form['track'] : 0;
+		$column   = isset( $form['column'] ) ? (string) $form['column'] : '';
+		$question = isset( $form['question'] ) && is_array( $form['question'] ) ? $form['question'] : array();
+		$locked   = ! empty( $form['locked'] );
+		$controls = self::controls();
+
+		// What was typed wins over what is stored, box by box, the way the track's own form does.
+		$value = function ( $property, $fallback = '' ) use ( $typed, $question ) {
+			if ( array_key_exists( $property, $typed ) ) {
+				return $typed[ $property ];
+			}
+
+			return array_key_exists( $property, $question ) ? $question[ $property ] : $fallback;
+		};
+
+		$type = (string) $value( 'type' );
+
+		self::render_flash( $flash );
+
+		$back = sprintf(
+			/* translators: %s: the track's name. */
+			__( 'Back to %s', 'wpcredits-program-manager' ),
+			isset( $form['label'] ) ? (string) $form['label'] : ''
+		);
+
+		printf( '<p><a href="%1$s">%2$s</a></p>', esc_url( add_query_arg( 'wpcpm_track', $track, $url ) ), esc_html( $back ) );
+
+		if ( ! empty( $form['read_only'] ) ) {
+			echo '<p class="wpcpm-tracks__readonly">' . esc_html__( 'This track runs from its hand-written form, so its questions cannot be edited here. Duplicate the track to start one of your own.', 'wpcredits-program-manager' ) . '</p>';
+
+			return;
+		}
+
+		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="wpcpm-question-form">';
+		wp_nonce_field( WPCPM_Track_Editor::ACTION_SAVE );
+		echo '<input type="hidden" name="action" value="' . esc_attr( WPCPM_Track_Editor::ACTION_SAVE ) . '" />';
+		printf( '<input type="hidden" name="track" value="%d" />', (int) $track );
+		printf( '<input type="hidden" name="wpcpm_question" value="%s" />', esc_attr( $column ) );
+
+		echo '<div class="wpcpm-question__identity">';
+
+		if ( $locked ) {
+			printf( '<input type="hidden" name="wpcpm_column" value="%s" />', esc_attr( $column ) );
+			printf( '<input type="hidden" name="wpcpm_type" value="%s" />', esc_attr( $type ) );
+			printf(
+				'<p><strong>%1$s</strong> <code>%2$s</code><br /><strong>%3$s</strong> %4$s</p>',
+				esc_html__( 'Airtable column', 'wpcredits-program-manager' ),
+				esc_html( $column ),
+				esc_html__( 'Control', 'wpcredits-program-manager' ),
+				esc_html( isset( $controls[ $type ] ) ? $controls[ $type ] : $type )
+			);
+			echo '<p class="wpcpm-question__locked">' . esc_html__( 'This question has been published, so its column and its control are fixed: the column in Airtable holds what students have written, in that shape. To ask it differently, remove it and add a new question with a column of its own.', 'wpcredits-program-manager' ) . '</p>';
+		} else {
+			printf(
+				'<p><label for="wpcpm_column">%1$s</label><br /><input type="text" class="regular-text" id="wpcpm_column" name="wpcpm_column" value="%2$s" /></p>',
+				esc_html__( 'Airtable column', 'wpcredits-program-manager' ),
+				esc_attr( (string) $value( 'column', $column ) )
+			);
+			printf( '<p><label for="wpcpm_type">%s</label><br /><select id="wpcpm_type" name="wpcpm_type">', esc_html__( 'Control', 'wpcredits-program-manager' ) );
+
+			foreach ( $controls as $control => $name ) {
+				printf( '<option value="%1$s"%3$s>%2$s</option>', esc_attr( $control ), esc_html( $name ), $control === $type ? ' selected="selected"' : '' );
+			}
+
+			echo '</select></p>';
+		}
+
+		self::render_identity_notices( $form );
+		echo '</div>';
+
+		echo '<table class="form-table" role="presentation"><tbody>';
+
+		self::render_text_row( 'label', __( 'What the student reads', 'wpcredits-program-manager' ), (string) $value( 'label' ) );
+
+		printf( '<tr><th scope="row"><label for="wpcpm_group">%s</label></th><td><select id="wpcpm_group" name="wpcpm_group">', esc_html__( 'Group', 'wpcredits-program-manager' ) );
+
+		foreach ( self::groups() as $group => $heading ) {
+			printf( '<option value="%1$s"%3$s>%2$s</option>', esc_attr( $group ), esc_html( $heading ), $group === (string) $value( 'group' ) ? ' selected="selected"' : '' );
+		}
+
+		echo '</select></td></tr>';
+
+		self::render_text_row( 'help', __( 'Help under the box', 'wpcredits-program-manager' ), (string) $value( 'help' ) );
+		self::render_text_row( 'lead', __( 'Heading before it', 'wpcredits-program-manager' ), (string) $value( 'lead' ) );
+		self::render_text_row( 'subgroup', __( 'Subheading before it', 'wpcredits-program-manager' ), (string) $value( 'subgroup' ) );
+		self::render_text_row( 'note', __( 'Note after the run', 'wpcredits-program-manager' ), (string) $value( 'note' ) );
+		self::render_text_row( 'row', __( 'Row', 'wpcredits-program-manager' ), (string) $value( 'row' ), __( 'Questions with the same row name sit side by side: lowercase letters, digits and hyphens.', 'wpcredits-program-manager' ) );
+		self::render_flag_row( 'stack', __( 'Shares one column of its row', 'wpcredits-program-manager' ), ! empty( $value( 'stack' ) ) );
+		self::render_flag_row( 'required', __( 'Marked required', 'wpcredits-program-manager' ), ! empty( $value( 'required' ) ) );
+		self::render_flag_row( 'hide_from_institution', __( 'Kept off everything an institution reads', 'wpcredits-program-manager' ), ! empty( $value( 'hide_from_institution' ) ) || 'email' === $type );
+
+		if ( 'number' === $type ) {
+			self::render_text_row( 'min', __( 'Lowest value', 'wpcredits-program-manager' ), (string) $value( 'min' ) );
+			self::render_text_row( 'max', __( 'Highest value', 'wpcredits-program-manager' ), (string) $value( 'max' ) );
+			self::render_text_row( 'step', __( 'Step', 'wpcredits-program-manager' ), (string) $value( 'step' ), __( 'The step also sets how many decimal places a new Airtable column keeps: 1 for whole numbers, 0.01 for a grade.', 'wpcredits-program-manager' ) );
+		}
+
+		if ( 'text' === $type ) {
+			self::render_text_row( 'maxlength', __( 'Length limit', 'wpcredits-program-manager' ), (string) $value( 'maxlength' ), __( 'Optional. A single-line box alone takes one; a text area already has its own.', 'wpcredits-program-manager' ) );
+		}
+
+		if ( 'textarea' === $type ) {
+			self::render_flag_row( 'mono', __( 'Monospace, for code', 'wpcredits-program-manager' ), ! empty( $value( 'mono' ) ) );
+		}
+
+		if ( 'select' === $type ) {
+			$options = $value( 'options', array() );
+
+			printf(
+				'<tr><th scope="row"><label for="wpcpm_options">%1$s</label></th><td><textarea id="wpcpm_options" name="wpcpm_options" rows="6" class="large-text code">%2$s</textarea><p class="description">%3$s</p></td></tr>',
+				esc_html__( 'Choices, one a line', 'wpcredits-program-manager' ),
+				esc_textarea( is_array( $options ) ? implode( "\n", array_map( 'strval', $options ) ) : (string) $options ),
+				esc_html__( 'A column that already exists in Airtable must offer every one of these; a new column is created with them.', 'wpcredits-program-manager' )
+			);
+		}
+
+		self::render_text_row( 'why', __( 'Developer note', 'wpcredits-program-manager' ), (string) $value( 'why' ), __( 'Why a column name looks like a slip. No student sees it.', 'wpcredits-program-manager' ) );
+
+		echo '</tbody></table>';
+
+		printf( '<p class="submit"><button type="submit" class="button button-primary">%s</button></p>', esc_html__( 'Save the question', 'wpcredits-program-manager' ) );
+		echo '</form>';
+	}
+
+	/**
+	 * What the top of the question's screen says about its column: shared, or forked.
+	 *
+	 * @param array $form The question as `question_form()` gives it.
+	 */
+	private static function render_identity_notices( array $form ) {
+		$owners = isset( $form['owners'] ) && is_array( $form['owners'] ) ? $form['owners'] : array();
+
+		if ( array() !== $owners ) {
+			$names = array();
+
+			foreach ( $owners as $owner ) {
+				$names[] = ! empty( $owner['published'] )
+					? (string) $owner['label']
+					/* translators: %s: a track's name. */
+					: sprintf( __( '%s (a draft)', 'wpcredits-program-manager' ), (string) $owner['label'] );
+			}
+
+			$notice = sprintf(
+				/* translators: %s: the names of the other tracks writing this column. */
+				__( 'This column is shared with %s. Changing the words keeps it shared. Changing the control or the choices gives this track a column of its own, named after it.', 'wpcredits-program-manager' ),
+				implode( ', ', $names )
+			);
+
+			printf( '<p class="wpcpm-question__notice wpcpm-question__notice--shared">%s</p>', esc_html( $notice ) );
+		}
+
+		if ( ! empty( $form['forked_from'] ) ) {
+			$notice = sprintf(
+				/* translators: %s: the column this question forked from. */
+				__( 'A column of this track\'s own, forked from %s. Its name can still be changed until the track is published.', 'wpcredits-program-manager' ),
+				(string) $form['forked_from']
+			);
+
+			printf( '<p class="wpcpm-question__notice wpcpm-question__notice--forked">%s</p>', esc_html( $notice ) );
+		}
+	}
+
+	/**
+	 * One text box in the properties table.
+	 *
+	 * @param string $property    The property, which names the field.
+	 * @param string $heading     The row's label.
+	 * @param string $value       What the box holds.
+	 * @param string $description A line under the box, or empty.
+	 */
+	private static function render_text_row( $property, $heading, $value, $description = '' ) {
+		printf(
+			'<tr><th scope="row"><label for="wpcpm_%1$s">%2$s</label></th><td><input type="text" class="regular-text" id="wpcpm_%1$s" name="wpcpm_%1$s" value="%3$s" />%4$s</td></tr>',
+			esc_attr( $property ),
+			esc_html( $heading ),
+			esc_attr( $value ),
+			'' === $description ? '' : '<p class="description">' . esc_html( $description ) . '</p>'
+		);
+	}
+
+	/**
+	 * One checkbox in the properties table.
+	 *
+	 * @param string $property The flag, which names the field.
+	 * @param string $heading  The row's label.
+	 * @param bool   $on       Whether it is ticked.
+	 */
+	private static function render_flag_row( $property, $heading, $on ) {
+		printf(
+			'<tr><th scope="row">%2$s</th><td><label for="wpcpm_%1$s"><input type="checkbox" id="wpcpm_%1$s" name="wpcpm_%1$s" value="1"%3$s /> %2$s</label></td></tr>',
+			esc_attr( $property ),
+			esc_html( $heading ),
+			$on ? ' checked="checked"' : ''
+		);
+	}
+
+	/**
+	 * The outcome of the last press, in core's notice shape.
+	 *
+	 * @param array $flash `status` and `message`, or empty.
+	 */
+	private static function render_flash( array $flash ) {
+		if ( empty( $flash['message'] ) ) {
+			return;
+		}
+
+		printf(
+			'<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>',
+			'error' === ( isset( $flash['status'] ) ? $flash['status'] : '' ) ? 'error' : 'success',
+			esc_html( (string) $flash['message'] )
+		);
+	}
+
 	/**
 	 * The questions of a track, by group, with what can be done to each.
 	 *
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-track-builder.php`

Expected: `bin/test-track-builder.php` ends `ALL PASS (151 checks)`. 

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-track-builder.php includes/tools/class-wpcpm-track-builder.php includes/tools/class-wpcpm-track-editor-screen.php
git commit -m "Track Builder T3a: one question on a screen of its own"
```

---

### Task 8: A track never published can be deleted, and the preflight refuses a trashed one

**Files:**
- Modify: `includes/tools/class-wpcpm-track-builder.php` (`rows()` carries `ever_published`; every arrow in that array re-aligns to the longer key)
- Modify: `includes/tools/class-wpcpm-track-builder-screen.php` (`render_actions()` offers Delete; `render_delete()`)
- Modify: `includes/tracks/class-wpcpm-track-publish.php` (the preflight refuses a trashed track before reading the base)
- Test: `bin/test-track-builder.php`, `bin/test-track-publish.php`

**Interfaces:**
- Consumes: Task 4's `ever_published()`, Task 5's `ACTION_DELETE` and `handle_delete()`, `WPCPM_Track_Store::state()`.
- Produces: each row of `WPCPM_Track_Builder::rows()` carries `ever_published`; the list draws `<form class="wpcpm-tracks__delete">` posting `wpcpm_track_delete` only for a track that is not built in and was never published, behind a confirmation naming the track; the preflight's finding `track_trashed`, answered before the schema is read.

Decision 25 on the screen: Delete is drawn only where the store would allow it, so the button is never one that can only fail. The confirmation names the track through `esc_js()`, which encodes markup and quotes before it escapes them, and the suite's `esc_js()` stand-in is made faithful to that: the T2b check that a label with markup reaches the page encoded would otherwise pass against a stand-in that encodes nothing.

The preflight's refusal closes the finding T2c's whole-branch review parked for the phase that added a trash control: a run that reached the store's own refusal would already have created its columns. Nothing in the plugin trashes a track, so this answers a crafted request and nothing else.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-track-builder.php b/bin/test-track-builder.php
index 5eb7f66..2e2d2e4 100644
--- a/bin/test-track-builder.php
+++ b/bin/test-track-builder.php
@@ -47,7 +47,9 @@ function get_userdata( $id ) { return isset( $GLOBALS['users'][ (int) $id ] ) ?
 function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['opts'] ) ? $GLOBALS['opts'][ $k ] : $d; }
 function wp_enqueue_style( $handle, $src = '', $deps = array() ) { $GLOBALS['enqueued'][] = array( 'style', $handle, $deps ); }
 function wp_enqueue_script( $handle, $src = '', $deps = array(), $ver = false, $footer = false ) { $GLOBALS['enqueued'][] = array( 'script', $handle, $deps, $footer ); }
-function esc_js( $s ) { return str_replace( array( '\\', "'" ), array( '\\\\', "\\'" ), (string) $s ); }
+// Faithful to core's esc_js(): markup and double quotes are encoded before the quotes are
+// escaped, so a track name with a tag in it cannot break out of the attribute it sits in.
+function esc_js( $s ) { $s = htmlspecialchars( (string) $s, ENT_COMPAT ); $s = preg_replace( '/&#(x)?0*(?(1)27|39);?/i', "'", $s ); return str_replace( "\n", '\\n', addslashes( str_replace( "\r", '', $s ) ) ); }
 
 class RedirectSignal extends Exception {}
 class DieSignal extends Exception {}
@@ -1625,5 +1627,59 @@ ck( 'a built-in track\'s question has no form at all, and points at Duplicate',
     array( substr_count( $read_only, '<form' ), false !== strpos( $read_only, 'Duplicate the track to start one of your own' ) ),
     array( 0, true ) );
 
+
+echo "\n=== Delete, on the list, for a track that was never published ===\n";
+
+WPCPM_Track_Store::$tracks = array(
+	21 => array(
+		'definition'  => array( 'key' => 'never', 'status' => 'Never Track', 'label' => 'Never "Published" Track', 'course_url' => '', 'questions' => array() ),
+		'state'       => 'draft',
+		'source'      => 'definition',
+		'log'         => array(),
+		'equivalence' => array( 'not_builtin' ),
+		'published'   => null,
+	),
+	22 => array(
+		'definition'  => array( 'key' => 'once', 'status' => 'Once Track', 'label' => 'Once Track', 'course_url' => '', 'questions' => array() ),
+		'state'       => 'draft',
+		'source'      => 'definition',
+		'log'         => array( array( 'at' => 1788000000, 'by' => 7, 'did' => 'publish' ), array( 'at' => 1788100000, 'by' => 7, 'did' => 'unpublish' ) ),
+		'equivalence' => array( 'not_builtin' ),
+		'published'   => null,
+	),
+	23 => array(
+		'definition'  => array( 'key' => 'design', 'status' => 'Designer Track', 'label' => 'Designer Track', 'course_url' => '', 'questions' => array() ),
+		'state'       => 'draft',
+		'source'      => 'builtin',
+		'log'         => array(),
+		'equivalence' => array(),
+		'published'   => null,
+	),
+);
+WPCPM_Students_Sync::$counts = array();
+$GLOBALS['opts']['wpcpm_tracks_skipped'] = array();
+
+$delete_rows = WPCPM_Track_Builder::rows();
+
+ck( 'each row says whether the track was ever published, from its log rather than its state',
+    array_column( $delete_rows, 'ever_published' ), array( false, true, false ) );
+
+ob_start();
+WPCPM_Track_Builder_Screen::render_list( array( 'rows' => $delete_rows, 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => array() ) );
+$delete_list = ob_get_clean();
+
+ck( 'Delete is drawn once: for the draft never published, not for the one unpublished since, not for the built-in draft',
+    array(
+        substr_count( $delete_list, 'class="wpcpm-tracks__delete"' ),
+        substr_count( $delete_list, 'name="action" value="wpcpm_track_delete"' ),
+        substr_count( $delete_list, 'name="_wpnonce" value="wpcpm_track_delete"' ),
+        substr_count( $delete_list, '<input type="hidden" name="track" value="21" />' ),
+    ),
+    array( 1, 1, 1, 1 ) );
+
+ck( 'its confirmation names the track, encoded for the script it sits in, and says what deleting means',
+    false !== strpos( $delete_list, 'onsubmit="return confirm(\'Delete Never &quot;Published&quot; Track? It was never published, so nothing in Airtable or on the live site refers to it. This cannot be undone.\');"' ),
+    true );
+
 printf( "\n%s (%d checks)\n", $fail ? sprintf( '%d FAILURE(S)', $fail ) : 'ALL PASS', $total );
 exit( $fail ? 1 : 0 );
diff --git a/bin/test-track-publish.php b/bin/test-track-publish.php
index 6c2ca0a..0ace1ad 100644
--- a/bin/test-track-publish.php
+++ b/bin/test-track-publish.php
@@ -56,6 +56,10 @@ class WPCPM_Track_Store {
 	public static function source( $post_id ) { return self::$sources[ $post_id ] ?? 'definition'; }
 	public static function php_differences( $post_id, array $definition ) { return self::$php_diffs[ $post_id ] ?? array(); }
 
+	public static $states = array();
+
+	public static function state( $post_id ) { return self::$states[ $post_id ] ?? 'draft'; }
+
 	public static $unpublished = array();
 
 	public static function publish( $post_id, $user_id = 0 ) {
@@ -297,6 +301,21 @@ WPCPM_Airtable::$schema = base( array( 'What you did' => 'singleLineText' ), arr
 ck( 'and a column of the wrong type, which would take the wrong shape of answer',
     codes( WPCPM_Track_Publish::preflight( 7 )['refusals'] ), array( 'column_type_mismatch' ) );
 
+echo "\n=== A trashed track is refused before the base is read ===\n";
+
+WPCPM_Airtable::$schema = base( array( 'What you did' => 'multilineText' ) );
+WPCPM_Track_Store::$states[7] = 'trash';
+$reads_before = WPCPM_Airtable::$reads;
+$trashed      = WPCPM_Track_Publish::preflight( 7 );
+WPCPM_Track_Store::$states = array();
+
+ck( 'a track in the trash is refused as that, and the schema is not read for it',
+    array( codes( $trashed['refusals'] ), WPCPM_Airtable::$reads - $reads_before ),
+    array( array( 'track_trashed' ), 0 ) );
+
+ck( 'and once it is not, the same track preflights as before',
+    codes( WPCPM_Track_Publish::preflight( 7 )['refusals'] ), array() );
+
 echo "\n=== The ceiling, which Airtable enforces part-way through ===\n";
 
 // Airtable refuses the request that passes 500 and leaves everything before it created, so the
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-track-builder.php` and `php bin/test-track-publish.php`

Expected: `bin/test-track-builder.php` stops with `FAIL each row says whether the track was ever published, from its log rather than its state`; `bin/test-track-publish.php` stops with `FAIL a track in the trash is refused as that, and the schema is not read for it`. `rows()` does not carry `ever_published` yet, and the preflight still reads the base for a trashed track.

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/tools/class-wpcpm-track-builder-screen.php b/includes/tools/class-wpcpm-track-builder-screen.php
index 4f8af06..950fcd2 100644
--- a/includes/tools/class-wpcpm-track-builder-screen.php
+++ b/includes/tools/class-wpcpm-track-builder-screen.php
@@ -150,6 +150,38 @@ final class WPCPM_Track_Builder_Screen {
 		if ( ! empty( $row['switched'] ) ) {
 			self::render_button( WPCPM_Track_Builder::ACTION_SWITCH_BUILTIN, (int) $row['id'], __( 'Run from its hand-written form', 'wpcredits-program-manager' ) );
 		}
+
+		// Delete is offered on a track that was never published and is not built in (decision 25).
+		// Every other track is the record of what was created in the base, and the store refuses
+		// it, so the button is not drawn where it could only fail.
+		if ( 'builtin' !== $row['source'] && empty( $row['ever_published'] ) ) {
+			self::render_delete( (int) $row['id'], (string) $row['label'] );
+		}
+	}
+
+	/**
+	 * Delete, behind a confirmation that names the track (decision 25).
+	 *
+	 * @param int    $track The track.
+	 * @param string $label Its name.
+	 */
+	private static function render_delete( $track, $label ) {
+		$confirm = sprintf(
+			/* translators: %s: the track's name. */
+			__( 'Delete %s? It was never published, so nothing in Airtable or on the live site refers to it. This cannot be undone.', 'wpcredits-program-manager' ),
+			$label
+		);
+
+		printf(
+			'<form method="post" action="%1$s" class="wpcpm-tracks__delete" onsubmit="return confirm(\'%2$s\');">',
+			esc_url( admin_url( 'admin-post.php' ) ),
+			esc_js( $confirm )
+		);
+		wp_nonce_field( WPCPM_Track_Editor::ACTION_DELETE );
+		echo '<input type="hidden" name="action" value="' . esc_attr( WPCPM_Track_Editor::ACTION_DELETE ) . '" />';
+		printf( '<input type="hidden" name="track" value="%d" />', (int) $track );
+		printf( '<button type="submit" class="button button-link-delete">%s</button>', esc_html__( 'Delete', 'wpcredits-program-manager' ) );
+		echo '</form>';
 	}
 
 	/**
diff --git a/includes/tools/class-wpcpm-track-builder.php b/includes/tools/class-wpcpm-track-builder.php
index 69f8229..5b8535b 100644
--- a/includes/tools/class-wpcpm-track-builder.php
+++ b/includes/tools/class-wpcpm-track-builder.php
@@ -189,20 +189,23 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 			$last      = self::last_publish( WPCPM_Track_Store::log_entries( $post_id ) );
 
 			$rows[] = array(
-				'id'           => $post_id,
-				'label'        => isset( $definition['label'] ) ? (string) $definition['label'] : '',
-				'status'       => $status,
-				'key'          => $key,
-				'course'       => isset( $definition['course_url'] ) ? (string) $definition['course_url'] : '',
-				'source'       => $source,
-				'state'        => WPCPM_Track_Store::state( $post_id ),
-				'students'     => WPCPM_Students_Sync::count_on_status( $status ),
-				'published_by' => (int) $last['by'],
-				'published_at' => (int) $last['at'],
-				'skipped'      => isset( $skipped[ $post_id ] ) ? (array) $skipped[ $post_id ] : array(),
-				'equivalence'  => WPCPM_Track_Store::equivalence( $post_id ),
-				'switched'     => WPCPM_Track_Store::switched( $post_id ),
-				'stale'        => 'builtin' === $source && ! is_array( $published ) && isset( $seeds[ $key ] ) && $seeds[ $key ] !== $definition,
+				'id'             => $post_id,
+				'label'          => isset( $definition['label'] ) ? (string) $definition['label'] : '',
+				'status'         => $status,
+				'key'            => $key,
+				'course'         => isset( $definition['course_url'] ) ? (string) $definition['course_url'] : '',
+				'source'         => $source,
+				'state'          => WPCPM_Track_Store::state( $post_id ),
+				'students'       => WPCPM_Students_Sync::count_on_status( $status ),
+				'published_by'   => (int) $last['by'],
+				'published_at'   => (int) $last['at'],
+				'skipped'        => isset( $skipped[ $post_id ] ) ? (array) $skipped[ $post_id ] : array(),
+				'equivalence'    => WPCPM_Track_Store::equivalence( $post_id ),
+				'switched'       => WPCPM_Track_Store::switched( $post_id ),
+				'stale'          => 'builtin' === $source && ! is_array( $published ) && isset( $seeds[ $key ] ) && $seeds[ $key ] !== $definition,
+				// From the log, not the state: an unpublished track is a draft again and is
+				// still the record of what was created in the base (decision 25).
+				'ever_published' => WPCPM_Track_Store::ever_published( $post_id ),
 			);
 		}
 
diff --git a/includes/tracks/class-wpcpm-track-publish.php b/includes/tracks/class-wpcpm-track-publish.php
index c39b559..9d8ea88 100644
--- a/includes/tracks/class-wpcpm-track-publish.php
+++ b/includes/tracks/class-wpcpm-track-publish.php
@@ -137,6 +137,14 @@ final class WPCPM_Track_Publish {
 			return self::answer( array( self::finding( 'no_definition', '', __( 'This track has no definition to publish.', 'wpcredits-program-manager' ) ) ), array() );
 		}
 
+		// Before the base is read: a trashed track is refused by the store at the end of the run,
+		// and a run that reached that refusal would already have created its columns. Nothing in
+		// the plugin trashes a track, so this answers a crafted request and nothing else (the
+		// design's decision 25, closing the finding T2c's whole-branch review parked).
+		if ( 'trash' === WPCPM_Track_Store::state( $post_id ) ) {
+			return self::answer( array( self::finding( 'track_trashed', '', __( 'This track is in the trash, so it cannot be published.', 'wpcredits-program-manager' ) ) ), array() );
+		}
+
 		// The store's own rules, asked once: a status or key another track holds, a column the
 		// syncs own. Its messages travel as they are, so the editor and this screen read the same.
 		foreach ( (array) WPCPM_Track_Store::check( $post_id, $definition ) as $error ) {
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-track-builder.php` and `php bin/test-track-publish.php`

Expected: `bin/test-track-builder.php` ends `ALL PASS (154 checks)` and `bin/test-track-publish.php` ends `ALL PASS (85 checks)`. 

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-track-builder.php bin/test-track-publish.php includes/tools/class-wpcpm-track-builder.php includes/tools/class-wpcpm-track-builder-screen.php includes/tracks/class-wpcpm-track-publish.php
git commit -m "Track Builder T3a: a track never published can be deleted, and the preflight refuses a trashed one"
```

---

### Task 9: The line above the list, off the cached schema

**Files:**
- Modify: `includes/tools/class-wpcpm-track-builder.php` (`schema_line()`; `form()` carries `schema`)
- Modify: `includes/tools/class-wpcpm-track-builder-screen.php` (passes `schema` through)
- Modify: `includes/tools/class-wpcpm-track-editor-screen.php` (`render_schema_line()`, and the row's own notice)
- Test: `bin/test-track-builder.php`

**Interfaces:**
- Consumes: Task 3's `cached_schema()`, `WPCPM_Track_Columns::judge()` and `field()`, `WPCPM_Settings::get()['reports_table']`.
- Produces: `WPCPM_Track_Builder::schema_line( array $definition ): array`, `create` (the columns publishing would make) and `age` (seconds), or empty when the base could not be read; `form()` gains `schema`, empty for a built-in track; `render_questions()` accepts `schema` and draws `<p class="wpcpm-questions__schema">` with the count and how old the reading is, and `Publishing will create this column in Airtable.` on the row of each column in `create`.

Decision 24's other half. The same verdicts the preflight reaches, from the same class, on the reading the editor is allowed to use. A column no control can create is left out of the count, because the preflight refuses it rather than creating it, and a row that said "publishing will create this" of it would be wrong. When the base cannot be read the line is left off rather than guessed, which is the preflight's own reason for refusing rather than guessing, and the list is still drawn.

The T2b check on `form()`'s keys gains `schema`. The parameter that carries a row's verdict is named `to_create`: `$new` is a reserved word and the standards gate refuses it as a parameter name.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-track-builder.php b/bin/test-track-builder.php
index 2e2d2e4..9ae1de0 100644
--- a/bin/test-track-builder.php
+++ b/bin/test-track-builder.php
@@ -131,10 +131,24 @@ class WPCPM_Track_Publish {
 	}
 }
 
-/** The settings, stood in for the one question the screen asks them. */
+/** The settings, stood in for the two questions the screen asks them. */
 class WPCPM_Settings {
 	public static $schema = true;
+	public static $values = array( 'reports_table' => 'tblReports' );
 	public static function has_schema_token() { return self::$schema; }
+	public static function get() { return self::$values; }
+}
+
+/** The client, stood in for the one call the editor makes: the cached reading, or no base. */
+class WPCPM_Airtable {
+	public static $cached = null;
+	public static $asked  = 0;
+
+	public function cached_schema() {
+		++self::$asked;
+
+		return null === self::$cached ? new WP_Error( 'wpcpm_airtable_error', 'The base could not be read.' ) : self::$cached;
+	}
 }
 
 class WPCPM_Track_Store {
@@ -504,7 +518,7 @@ echo "\n=== The properties form ===\n";
 // PHP is what the switch rests on (spec section 6), and the store refuses the save in any case.
 ck( 'the form offers the track properties, then its questions and every other track\'s columns',
     array_keys( WPCPM_Track_Builder::form( 13 ) ),
-    array( 'id', 'label', 'status', 'key', 'course_url', 'learn_course_id', 'hours_target', 'hue', 'read_only', 'questions', 'others' ) );
+    array( 'id', 'label', 'status', 'key', 'course_url', 'learn_course_id', 'hours_target', 'hue', 'read_only', 'questions', 'others', 'schema' ) );
 ck( 'filled from the definition', array( WPCPM_Track_Builder::form( 13 )['label'], WPCPM_Track_Builder::form( 13 )['status'], WPCPM_Track_Builder::form( 13 )['read_only'] ), array( 'Marketing Track', 'Marketing Track', false ) );
 ck( 'and a built-in track its PHP runs is read-only', WPCPM_Track_Builder::form( 11 )['read_only'], true );
 
@@ -1681,5 +1695,90 @@ ck( 'its confirmation names the track, encoded for the script it sits in, and sa
     false !== strpos( $delete_list, 'onsubmit="return confirm(\'Delete Never &quot;Published&quot; Track? It was never published, so nothing in Airtable or on the live site refers to it. This cannot be undone.\');"' ),
     true );
 
+
+echo "\n=== The line above the list: what publishing would create, off the cached reading ===\n";
+
+WPCPM_Track_Store::$tracks = array( 13 => editable_track(), 11 => array(
+	'definition'  => array( 'key' => '150h', 'status' => 'In Sensei', 'label' => '150-hour Track', 'questions' => array( 'Hours' => array( 'type' => 'number', 'label' => 'Hours', 'group' => 'hours' ) ) ),
+	'state'       => 'published',
+	'source'      => 'builtin',
+	'log'         => array( array( 'at' => 1788000000, 'by' => 7, 'did' => 'publish' ) ),
+	'equivalence' => array(),
+	'published'   => array( 'key' => '150h' ),
+) );
+WPCPM_Track_Store::$tracks[13]['definition']['questions']['Main Contribution Team'] = array( 'type' => 'team', 'label' => 'Your team', 'group' => 'project' );
+
+/** The base as the cached reading holds it: two of the track's columns exist, one of the right type. */
+function cached_base( $age ) {
+	return array(
+		'age'    => $age,
+		'schema' => array(
+			'tblReports' => array(
+				'name'    => 'Students Reports',
+				'columns' => array(
+					'Hours'      => array( 'type' => 'number', 'options' => array() ),
+					'Slack name' => array( 'type' => 'singleLineText', 'options' => array() ),
+				),
+			),
+		),
+	);
+}
+
+WPCPM_Airtable::$cached = cached_base( 300 );
+WPCPM_Airtable::$asked  = 0;
+$line = WPCPM_Track_Builder::schema_line( WPCPM_Track_Store::$tracks[13]['definition'] );
+
+ck( 'the columns the base lacks are the ones publishing would create, judged by the class the preflight uses, and the reading\'s age travels with them',
+    $line, array( 'create' => array( 'Your blog' ), 'age' => 300 ) );
+
+ck( 'a column no control can create is not counted: the preflight refuses it rather than creating it',
+    in_array( 'Main Contribution Team', $line['create'], true ), false );
+
+ck( 'form() carries the reading for a track of somebody\'s own, and asks the client once',
+    array( WPCPM_Track_Builder::form( 13 )['schema'], WPCPM_Airtable::$asked ), array( $line, 2 ) );
+
+WPCPM_Airtable::$asked = 0;
+
+ck( 'and does not ask at all for a built-in track, whose columns all exist',
+    array( WPCPM_Track_Builder::form( 11 )['schema'], WPCPM_Airtable::$asked ), array( array(), 0 ) );
+
+ob_start();
+WPCPM_Track_Builder_Screen::render_form( array( 'form' => WPCPM_Track_Builder::form( 13 ), 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => array() ) );
+$aged = ob_get_clean();
+
+ck( 'the line says how many columns, how old the reading is, and that the publish screen reads afresh',
+    false !== strpos( $aged, '<p class="wpcpm-questions__schema">Publishing will create 1 column in Airtable. <span class="wpcpm-questions__age">Read from Airtable 5 minutes ago; the publish screen reads it afresh.</span></p>' ),
+    true );
+
+ck( 'and the row of that column says so, once, on the right row',
+    array( substr_count( $aged, 'Publishing will create this column in Airtable.' ), preg_match( '/data-wpcpm-column="Your blog"[^\n]*?Publishing will create this column/', $aged ) ),
+    array( 1, 1 ) );
+
+WPCPM_Airtable::$cached = cached_base( 12 );
+ob_start();
+WPCPM_Track_Builder_Screen::render_form( array( 'form' => WPCPM_Track_Builder::form( 13 ), 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => array() ) );
+$fresh_line = ob_get_clean();
+
+ck( 'a reading under a minute old was read just now',
+    false !== strpos( $fresh_line, 'Read from Airtable just now.' ), true );
+
+unset( WPCPM_Track_Store::$tracks[13]['definition']['questions']['Your blog'], WPCPM_Track_Store::$tracks[13]['definition']['questions']['Main Contribution Team'] );
+ob_start();
+WPCPM_Track_Builder_Screen::render_form( array( 'form' => WPCPM_Track_Builder::form( 13 ), 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => array() ) );
+$nothing_new = ob_get_clean();
+
+ck( 'a track whose columns all exist needs no new columns, and no row says otherwise',
+    array( false !== strpos( $nothing_new, 'This track needs no new Airtable columns.' ), substr_count( $nothing_new, 'Publishing will create this column' ) ),
+    array( true, 0 ) );
+
+WPCPM_Airtable::$cached = null;
+ob_start();
+WPCPM_Track_Builder_Screen::render_form( array( 'form' => WPCPM_Track_Builder::form( 13 ), 'url' => 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder', 'flash' => array() ) );
+$unread = ob_get_clean();
+
+ck( 'when the base cannot be read the line is left off rather than guessed, and the list is still drawn',
+    array( substr_count( $unread, 'wpcpm-questions__schema' ), substr_count( $unread, 'class="wpcpm-question"' ) ),
+    array( 0, 2 ) );
+
 printf( "\n%s (%d checks)\n", $fail ? sprintf( '%d FAILURE(S)', $fail ) : 'ALL PASS', $total );
 exit( $fail ? 1 : 0 );
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-track-builder.php`

Expected: `bin/test-track-builder.php` stops with `FAIL the form offers the track properties, then its questions and every other track's columns`. `form()` does not carry `schema` yet, and `schema_line()` does not exist.

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/tools/class-wpcpm-track-builder-screen.php b/includes/tools/class-wpcpm-track-builder-screen.php
index 950fcd2..c9b17db 100644
--- a/includes/tools/class-wpcpm-track-builder-screen.php
+++ b/includes/tools/class-wpcpm-track-builder-screen.php
@@ -607,6 +607,7 @@ final class WPCPM_Track_Builder_Screen {
 				'key'       => isset( $form['key'] ) ? (string) $form['key'] : '',
 				'questions' => isset( $form['questions'] ) && is_array( $form['questions'] ) ? $form['questions'] : array(),
 				'others'    => isset( $form['others'] ) && is_array( $form['others'] ) ? $form['others'] : array(),
+				'schema'    => isset( $form['schema'] ) && is_array( $form['schema'] ) ? $form['schema'] : array(),
 				'url'       => $url,
 				'read_only' => ! empty( $form['read_only'] ),
 			)
diff --git a/includes/tools/class-wpcpm-track-builder.php b/includes/tools/class-wpcpm-track-builder.php
index 5b8535b..a5517f7 100644
--- a/includes/tools/class-wpcpm-track-builder.php
+++ b/includes/tools/class-wpcpm-track-builder.php
@@ -232,6 +232,7 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 		$post_id    = (int) $post_id;
 		$definition = WPCPM_Track_Store::get( $post_id );
 		$definition = is_array( $definition ) ? $definition : array();
+		$read_only  = 'builtin' === WPCPM_Track_Store::source( $post_id );
 
 		return array(
 			'id'              => $post_id,
@@ -242,11 +243,55 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 			'learn_course_id' => isset( $definition['learn_course_id'] ) ? (int) $definition['learn_course_id'] : '',
 			'hours_target'    => isset( $definition['hours_target'] ) ? (int) $definition['hours_target'] : '',
 			'hue'             => isset( $definition['hue'] ) ? (string) $definition['hue'] : '',
-			'read_only'       => 'builtin' === WPCPM_Track_Store::source( $post_id ),
+			'read_only'       => $read_only,
 			// The questions and every other track's columns, for the list under the properties
 			// (T3a): the sharing index is read once here, not once per row.
 			'questions'       => isset( $definition['questions'] ) && is_array( $definition['questions'] ) ? $definition['questions'] : array(),
 			'others'          => WPCPM_Track_Store::others( $post_id ),
+			// A built-in track's columns all exist, and its list offers nothing to press.
+			'schema'          => $read_only ? array() : self::schema_line( $definition ),
+		);
+	}
+
+	/**
+	 * What publishing would create in the base, off the cached reading (decision 24).
+	 *
+	 * The same verdicts the preflight reaches, from the same class, on the reading the editor is
+	 * allowed to use: the line above the question list is advice, and the publish screen reads
+	 * the base afresh before anything is created. A column no control can create is left out of
+	 * the count, because the preflight refuses it rather than creating it, and a row that said
+	 * "publishing will create this" of it would be wrong.
+	 *
+	 * @param array $definition The track's definition.
+	 * @return array `create` (the columns) and `age` (seconds), or empty when the base could not
+	 *               be read, so the line is left off rather than guessed.
+	 */
+	public static function schema_line( array $definition ) {
+		$settings = WPCPM_Settings::get();
+		$reports  = isset( $settings['reports_table'] ) ? (string) $settings['reports_table'] : '';
+		$client   = new WPCPM_Airtable();
+		$held     = $client->cached_schema();
+
+		if ( is_wp_error( $held ) || '' === $reports || ! isset( $held['schema'][ $reports ]['columns'] ) || ! is_array( $held['schema'][ $reports ]['columns'] ) ) {
+			return array();
+		}
+
+		$columns   = $held['schema'][ $reports ]['columns'];
+		$questions = isset( $definition['questions'] ) && is_array( $definition['questions'] ) ? $definition['questions'] : array();
+		$create    = array();
+
+		foreach ( $questions as $column => $question ) {
+			$column   = (string) $column;
+			$question = is_array( $question ) ? $question : array();
+
+			if ( 'create' === WPCPM_Track_Columns::judge( $column, $question, $columns ) && null !== WPCPM_Track_Columns::field( $column, $question ) ) {
+				$create[] = $column;
+			}
+		}
+
+		return array(
+			'create' => $create,
+			'age'    => isset( $held['age'] ) ? (int) $held['age'] : 0,
 		);
 	}
 
diff --git a/includes/tools/class-wpcpm-track-editor-screen.php b/includes/tools/class-wpcpm-track-editor-screen.php
index 38a42a1..469b448 100644
--- a/includes/tools/class-wpcpm-track-editor-screen.php
+++ b/includes/tools/class-wpcpm-track-editor-screen.php
@@ -296,6 +296,8 @@ class WPCPM_Track_Editor_Screen {
 	 *
 	 * @param array $args `track` (the post ID), `key`, `questions` (column => spec, in order),
 	 *                    `others` (every other track as `WPCPM_Track_Store::others()` gives them),
+	 *                    `schema` (`create`, the columns publishing would make, and `age`, how
+	 *                    old the reading is in seconds; empty when the base could not be read),
 	 *                    the screen's `url`, and `read_only` for a built-in track its PHP still runs.
 	 */
 	public static function render_questions( array $args ) {
@@ -303,12 +305,16 @@ class WPCPM_Track_Editor_Screen {
 		$key       = isset( $args['key'] ) ? (string) $args['key'] : '';
 		$questions = isset( $args['questions'] ) && is_array( $args['questions'] ) ? $args['questions'] : array();
 		$others    = isset( $args['others'] ) && is_array( $args['others'] ) ? $args['others'] : array();
+		$schema    = isset( $args['schema'] ) && is_array( $args['schema'] ) ? $args['schema'] : array();
+		$create    = isset( $schema['create'] ) && is_array( $schema['create'] ) ? array_map( 'strval', $schema['create'] ) : array();
 		$url       = isset( $args['url'] ) ? (string) $args['url'] : '';
 		$read_only = ! empty( $args['read_only'] );
 
 		echo '<div class="wpcpm-questions">';
 		echo '<h2 class="wpcpm-questions__heading">' . esc_html__( 'Questions', 'wpcredits-program-manager' ) . '</h2>';
 
+		self::render_schema_line( $schema );
+
 		foreach ( self::groups() as $group => $heading ) {
 			printf( '<section class="wpcpm-questions__group" id="wpcpm-questions-%s">', esc_attr( $group ) );
 			printf( '<h3>%s</h3>', esc_html( $heading ) );
@@ -337,7 +343,7 @@ class WPCPM_Track_Editor_Screen {
 				echo '</tr></thead><tbody>';
 
 				foreach ( $rows as $column => $spec ) {
-					self::render_row( $track, $key, $column, $spec, $others, $url, $read_only );
+					self::render_row( $track, $key, $column, $spec, $others, $url, $read_only, in_array( (string) $column, $create, true ) );
 				}
 
 				echo '</tbody></table>';
@@ -363,8 +369,9 @@ class WPCPM_Track_Editor_Screen {
 	 * @param array  $others    Every other track.
 	 * @param string $url       The screen's URL.
 	 * @param bool   $read_only Whether the row offers nothing to press.
+	 * @param bool   $to_create Whether publishing would create this column in the base.
 	 */
-	private static function render_row( $track, $key, $column, array $spec, array $others, $url, $read_only ) {
+	private static function render_row( $track, $key, $column, array $spec, array $others, $url, $read_only, $to_create = false ) {
 		$controls = self::controls();
 		$type     = isset( $spec['type'] ) ? (string) $spec['type'] : '';
 		$group    = isset( $spec['group'] ) ? (string) $spec['group'] : '';
@@ -379,6 +386,11 @@ class WPCPM_Track_Editor_Screen {
 		printf( '<td><strong>%s</strong>', esc_html( isset( $spec['label'] ) ? (string) $spec['label'] : '' ) );
 		printf( '<code class="wpcpm-question__column">%s</code>', esc_html( $column ) );
 		self::render_notice( $column, $key, $others );
+
+		if ( $to_create ) {
+			echo '<span class="wpcpm-question__notice wpcpm-question__notice--new">' . esc_html__( 'Publishing will create this column in Airtable.', 'wpcredits-program-manager' ) . '</span>';
+		}
+
 		echo '</td>';
 
 		printf( '<td>%s</td>', esc_html( isset( $controls[ $type ] ) ? $controls[ $type ] : $type ) );
@@ -398,6 +410,50 @@ class WPCPM_Track_Editor_Screen {
 		echo '</td></tr>';
 	}
 
+	/**
+	 * The line above the list: what publishing would create, off the cached reading (decision 24).
+	 *
+	 * Left off when the base could not be read: guessing would make every column look like one
+	 * to create, which is the preflight's own reason for refusing rather than guessing.
+	 *
+	 * @param array $schema `create` and `age`, or empty.
+	 */
+	private static function render_schema_line( array $schema ) {
+		if ( ! isset( $schema['create'], $schema['age'] ) || ! is_array( $schema['create'] ) ) {
+			return;
+		}
+
+		$count = count( $schema['create'] );
+		$age   = (int) $schema['age'];
+
+		if ( 0 === $count ) {
+			$line = __( 'This track needs no new Airtable columns.', 'wpcredits-program-manager' );
+		} else {
+			$line = sprintf(
+				/* translators: %d: how many columns publishing would create. */
+				_n( 'Publishing will create %d column in Airtable.', 'Publishing will create %d columns in Airtable.', $count, 'wpcredits-program-manager' ),
+				$count
+			);
+		}
+
+		if ( $age < 60 ) {
+			$when = __( 'Read from Airtable just now.', 'wpcredits-program-manager' );
+		} else {
+			$minutes = (int) floor( $age / 60 );
+			$when    = sprintf(
+				/* translators: %d: a number of minutes. */
+				_n( 'Read from Airtable %d minute ago; the publish screen reads it afresh.', 'Read from Airtable %d minutes ago; the publish screen reads it afresh.', $minutes, 'wpcredits-program-manager' ),
+				$minutes
+			);
+		}
+
+		printf(
+			'<p class="wpcpm-questions__schema">%1$s <span class="wpcpm-questions__age">%2$s</span></p>',
+			esc_html( $line ),
+			esc_html( $when )
+		);
+	}
+
 	/**
 	 * What a row says under its words: who else writes the column, or what it forked from.
 	 *
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-track-builder.php`

Expected: `bin/test-track-builder.php` ends `ALL PASS (163 checks)`. 

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-track-builder.php includes/tools/class-wpcpm-track-builder.php includes/tools/class-wpcpm-track-builder-screen.php includes/tools/class-wpcpm-track-editor-screen.php
git commit -m "Track Builder T3a: the line above the list, off the cached schema"
```

---

### Task 10: Unpublishing returns to the publish screen

**Files:**
- Modify: `includes/tools/class-wpcpm-track-builder.php` (`report()` takes the screen to return to; `handle_unpublish()` names the publish screen)
- Test: `bin/test-track-builder.php`

**Interfaces:**
- Consumes: `report()` and `handle_unpublish()` as T2c left them.
- Produces: `report( $result, $message, array $args = array() )`; unpublishing redirects to `?wpcpm_publish=<id>` on success and on a refusal alike. The two switch handlers keep returning to the list.

The finding T2c's Task 9 review parked as L3 and its final review said to fold into the next edit of this file: the press came from the track's publish screen, and that screen shows the state the press changed, so it is where the person comes back to.

- [ ] **Step 1: Write the failing checks**

```diff
diff --git a/bin/test-track-builder.php b/bin/test-track-builder.php
index 9ae1de0..e76e1e3 100644
--- a/bin/test-track-builder.php
+++ b/bin/test-track-builder.php
@@ -1780,5 +1780,42 @@ ck( 'when the base cannot be read the line is left off rather than guessed, and
     array( substr_count( $unread, 'wpcpm-questions__schema' ), substr_count( $unread, 'class="wpcpm-question"' ) ),
     array( 0, 2 ) );
 
+
+echo "\n=== Unpublishing returns to the publish screen ===\n";
+
+WPCPM_Track_Store::$tracks   = array( 13 => editable_track() );
+WPCPM_Track_Publish::$answer = null;
+WPCPM_Track_Publish::$down   = array();
+$GLOBALS['can_manage']       = true;
+$GLOBALS['nonce']            = WPCPM_Track_Builder::ACTION_UNPUBLISH;
+$_POST                       = array( 'track' => 13 );
+WPCPM_Flash::$set            = array();
+$went = '';
+
+try {
+	$tool->handle_unpublish();
+} catch ( RedirectSignal $e ) {
+	$went = $e->getMessage();
+}
+
+ck( 'a track taken down comes back to its own publish screen, where the press came from, not to the list',
+    array( $went, WPCPM_Track_Publish::$down, WPCPM_Flash::$set['track-builder']['status'] ?? '' ),
+    array( 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder&wpcpm_publish=13', array( array( 13, 5 ) ), 'success' ) );
+
+WPCPM_Track_Publish::$answer = new WP_Error( 'wpcpm_track_in_use', 'Three students hold this status.' );
+$went = '';
+
+try {
+	$tool->handle_unpublish();
+} catch ( RedirectSignal $e ) {
+	$went = $e->getMessage();
+}
+
+WPCPM_Track_Publish::$answer = null;
+
+ck( 'and so does a refusal, with the reason',
+    array( $went, WPCPM_Flash::$set['track-builder']['message'] ?? '' ),
+    array( 'https://example.test/wp-admin/admin.php?page=wpcpm-tool-track-builder&wpcpm_publish=13', 'Three students hold this status.' ) );
+
 printf( "\n%s (%d checks)\n", $fail ? sprintf( '%d FAILURE(S)', $fail ) : 'ALL PASS', $total );
 exit( $fail ? 1 : 0 );
```

- [ ] **Step 2: Run them and watch them fail**

Run: `php bin/test-track-builder.php`

Expected: `bin/test-track-builder.php` stops with `FAIL a track taken down comes back to its own publish screen, where the press came from, not to the list`. The redirect still names the list.

- [ ] **Step 3: Write the code**

```diff
diff --git a/includes/tools/class-wpcpm-track-builder.php b/includes/tools/class-wpcpm-track-builder.php
index a5517f7..f8e8082 100644
--- a/includes/tools/class-wpcpm-track-builder.php
+++ b/includes/tools/class-wpcpm-track-builder.php
@@ -655,14 +655,16 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 	 *
 	 * @param int|WP_Error $result  What the store answered.
 	 * @param string       $message What to say when it worked.
+	 * @param array        $args    Query arguments naming the screen to come back to; none for the list.
 	 */
-	private function report( $result, $message ) {
+	private function report( $result, $message, array $args = array() ) {
 		if ( is_wp_error( $result ) ) {
 			$this->redirect_back(
 				array(
 					'status'  => 'error',
 					'message' => $result->get_error_message(),
-				)
+				),
+				$args
 			);
 		}
 
@@ -670,7 +672,8 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 			array(
 				'status'  => 'success',
 				'message' => $message,
-			)
+			),
+			$args
 		);
 	}
 
@@ -767,9 +770,12 @@ class WPCPM_Track_Builder extends WPCPM_Tool {
 
 		$track = WPCPM_Request::posted_id( 'track' );
 
+		// Back to the track's own publish screen, where the press came from, rather than the list:
+		// the screen shows the state the press changed (T2c's Task 9 review, its L3).
 		$this->report(
 			WPCPM_Track_Publish::take_down( $track, get_current_user_id() ),
-			__( 'The track is a draft again. Nothing was changed in Airtable, and its status is still in "Currently mentoring".', 'wpcredits-program-manager' )
+			__( 'The track is a draft again. Nothing was changed in Airtable, and its status is still in "Currently mentoring".', 'wpcredits-program-manager' ),
+			array( 'wpcpm_publish' => $track )
 		);
 	}
 
```

- [ ] **Step 4: Run them and watch them pass**

Run: `php bin/test-track-builder.php`

Expected: `bin/test-track-builder.php` ends `ALL PASS (165 checks)`. 

- [ ] **Step 5: Run everything**

```bash
for f in bin/test-*.php; do php "$f" >/dev/null 2>&1 || echo "FAIL $f"; done
php bin/check-references.php | tail -1
php bin/check-spelling.php | tail -1
php bin/check-dead-annotations.php | tail -1
bash bin/check-standards.sh | tail -1
```

Expected: the battery prints nothing, then a line ending `all resolve`, a line ending `US English throughout.`, a line ending `0 dead.`, and `85 warnings, no errors.` (or fewer warnings).

- [ ] **Step 6: Commit**

```bash
git add bin/test-track-builder.php includes/tools/class-wpcpm-track-builder.php
git commit -m "Track Builder T3a: unpublishing returns to the publish screen"
```

---

### Task 11: Release 1.105.0

**Files:**
- Modify: `wpcredits-program-manager.php` (the `Version:` header and `WPCPM_VERSION`), `readme.txt` (`Stable tag:` and a changelog entry), `languages/wpcredits-program-manager.pot` (regenerated)

- [ ] **Step 1: Move the version.** `1.104.0` becomes `1.105.0` in the plugin header's `Version:` line, in `define( 'WPCPM_VERSION', ... )` and in `readme.txt`'s `Stable tag:`. Every other mention of 1.104.0 stays, including the changelog's own heading.

- [ ] **Step 2: Write the changelog entry**, first under `== Changelog ==` in `readme.txt`, above the previous entry and with one empty line after it:

```text
= 1.105.0 =

* The Track Builder edits a track's questions. Under a track's properties its questions are listed by group; each is edited on a screen of its own, moved up or down within its group, or removed, and a question is added to a group with its Airtable column, its words and its control.
* A question whose column another track also writes says so and names the track. Rewording keeps the column shared; changing its control or its choices gives this track a column of its own, named after the track, so the other tracks are not changed.
* A question that has been published keeps its column and its control, because the column in Airtable holds what students have written, in that shape. Its wording can still change; to ask it differently, remove it and add a new question.
* The line above the questions says how many columns publishing would create, from a reading of the base kept for fifteen minutes. The publish screen still reads the base afresh before anything is created.
* A track that was never published can be deleted from the track list. One that has been published is kept as the record of what was created in Airtable, and can only be unpublished.
* Publishing refuses a select question whose Airtable column does not offer every one of its choices, naming the missing ones, since Airtable's API cannot add a choice; and it refuses a track in the trash before reading the base.
* Unpublishing a track returns to its publish screen rather than to the list.
```

- [ ] **Step 3: Regenerate the translation template.** `sh bin/make-pot.sh`. Expected: `Success: POT file successfully generated.` and a header reading `Project-Id-Version: WPCredits Program Manager 1.105.0`. (WP-CLI prints a deprecation notice from its own colors library first; it is not the plugin's.)

- [ ] **Step 4: Run everything.** Expected: silent, clean, `85 warnings, no errors.`

- [ ] **Step 5: Build the zip and read it back.**

```bash
bash bin/build
unzip -p ../wpcredits-program-manager.zip wpcredits-program-manager/wpcredits-program-manager.php | grep "Version:"
unzip -Z1 ../wpcredits-program-manager.zip | grep -cE '^wpcredits-program-manager/(bin|docs)/'
unzip -Z1 ../wpcredits-program-manager.zip | grep -c 'assets/js/track-editor.js'
```

Expected: `Version:           1.105.0`, `0`, and `1` (the script ships).

- [ ] **Step 6: Commit.**

```bash
git add wpcredits-program-manager.php readme.txt languages/wpcredits-program-manager.pot
git commit -m "Track Builder T3a: 1.105.0"
```

- [ ] **Step 7: Merge and mirror, on the product owner's choice.** Merge `track-builder-t3a` into `main` and run the battery on the result. Then push the source to the public mirror: pull the `WordPress/WPCredits` clone at `~/GitHub/Plugins/WPCredits-Tracker-mirror` (branch `trunk`), rsync the plugin into its `Education/WordPress Education Dashboard/wpcredits-program-manager/` with `rsync -a --delete --exclude '.git/' --exclude '.superpowers/' --exclude '.DS_Store' --exclude 'node_modules/' --exclude '*.zip' --exclude '.*.swp'`, update the version in that folder's `README.md` table, scan the added lines for keys, record IDs, email addresses and names, read `git diff --stat`, then commit and push as two separate steps. This plan and its spec amendment travel with the source; neither holds a Liquid tag (a brace followed by a percent sign), which a Jekyll build of the mirror would fail on.

- [ ] **Step 8: Deploy only on the product owner's yes.** Ask first. On a yes, follow the deploy recorded for `wordpresseducation.org`: stream the zip over `ssh wpcredits-dashboard`, check its md5 on arrival, install it as a step of its own, read the version back, and purge the edge cache. Before the install and after it, run one read-only check of what a person sees: the program map, the Programs running card drawn as a Program Administrator, the Student Report Card drawn as the TEST students, and the Track Builder's list drawn as a Program Administrator, with version strings and relative times normalized. The two runs must be identical.

**The live site needs nothing new to take this release.** The editor writes WordPress posts; the line above the questions reads the base's schema with the everyday token, which every sync already holds; nothing reaches Airtable or a student until somebody publishes a track, and publishing is unchanged from 1.104.0. Every track stays exactly as it is.

---

## What T3a leaves for T3b

- **Preview, a blank track and History** (decision 21). Preview means splitting `render_body()`'s group and field loop in `class-wpcpm-student-report-form.php` so it takes a field set and empty values, which is surgery on the file that draws the live Student Report Card and deserves its own review. A blank track needs only `WPCPM_Track_Store::create()` behind a button, now that the editor can fill it. History has its raw material already: every save is a revision, and `_wpcpm_track_published` is the published copy.
- **A control change that needs more properties is a two-step** (what this plan decides, 5): choose the control, save, fill in what the refusal names, save. T3b may draw every control's boxes and show the right ones in the browser, if that round trip turns out to matter to whoever builds a track.
- **`learn_lesson_id` is carried through and not drawn.** A duplicate keeps what it inherited; T3c is where it becomes editable, beside the lessons of the track's course.
- **The add form seeds the words from the person, not the column** (4.2). T3c's "Add a question under this lesson" seeds `lead` and `learn_lesson_id` from the lesson instead.

## What this plan parks, with its reasons

- **The two-step control change** above, rather than drawing every control's properties at once: the page would carry the boxes of ten controls for one question, and the refusal already names exactly what is missing.
- **`forget_counts()` still has no production caller**, as T2c's final review noted; the counts are read once per page and the page is short-lived.
- **Spec 7.4's "N students, 0 report rows" count** and **`wp wpcredits seed-tracks` exiting non-zero on a failed seed** stay where T2c left them, for T3c.
- **The Track Builder section of `docs/sections/32-admin-tools.md`** is T3c's, once the screen is complete enough to describe in one pass.
