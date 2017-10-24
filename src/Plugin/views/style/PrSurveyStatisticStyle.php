<?php

namespace Drupal\pr_survey\Plugin\views\style;

use Drupal\views\Plugin\views\style\StylePluginBase;

/**
 * Unformatted style plugin to render row one after another with no decorations.
 *
 * @ingroup views_style_plugins
 *
 * @ViewsStyle(
 *   id = "pr_survey",
 *   title = @Translation("Statistic"),
 *   help = @Translation("Statistic."),
 *   theme = "pr_survey_statistic",
 *   display_types = {"normal"}
 * )
 */
class PrSurveyStatisticStyle extends StylePluginBase {

  /**
   * Does the style plugin allows to use style plugins.
   *
   * @var bool
   */
  protected $usesRowPlugin = FALSE;

  /**
   * Does the style plugin support custom css class for the rows.
   *
   * @var bool
   */
  protected $usesRowClass = FALSE;

  /**
   * Render the display in this style.
   */
  public function render() {
    $count_query = $this->view->build_info['count_query'];
    $count_query = $count_query->countQuery();
    $this->view->total_rows = $count_query->execute()->fetchField();

    // Group the rows according to the grouping instructions, if specified.
    $sets = $this->renderGrouping(
      $this->view->result,
      $this->options['grouping'],
      TRUE
    );
    $render = $this->renderGroupingSets($sets);
    $render[0]['#statistic'] = t('Found @count responder(s) matching given criteria.', ['@count' => $this->view->total_rows]);
    return $render;
  }

}
