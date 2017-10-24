(function ($) {
  Drupal.behaviors.prSurveyTaking = {
    data: {},
    survey: undefined,
    attach: function (context, settings) {
      var self = this;
      $('.pr-survey', context).once('prSurveyTaking').each(function () {
        self.survey = $(this);
        self.innitAddEvents();
        self.surveyFormEvent();
        var events = settings.prSurveyTaking;
        self.triggerEvents(events);
      });
    },

    // Innit survey main form event.
    surveyFormEvent: function () {
      var self = this;
      var $form = this.survey.find('.survey-input-form');
      var $textarea = $('textarea', $form);
      var $button = $('input', $form);
      $textarea.on('input propertychange', function () {
        var val = $(this).val().trim();
        if (val == null || val == '') {
          $button.prop('disabled', true);
        }
        else {
          $button.prop('disabled', false);
        }
      });
      $form.on('submit', function (e) {
        e.preventDefault();
        var val = $textarea.val();
        $textarea.val('');
        self.survey.trigger('messageAdded', [val]);
      });
    },

    // Getting question answer.
    gettingData: function (form, type) {
      switch (type) {
        case 'qs-image':
          form.find('input').prop('disabled', true);
          this.data['answer'] = form.find('input:checked').val().replace('fid-', '');
          break;
  
        case 'qs-text':
          form.find('input').prop('disabled', true);
          this.data['answer'] = form.find('input:checked').val();
          break;
  
        case 'question-datetime':
          form.find('input').prop('disabled', true);
          form.find('button').prop('disabled', true);
          this.data['answer'] = form.find('input[name="date"]').val();
          break;
      }
    },
  
    // Innit of events.
    innitAddEvents: function () {
      var self = this;
      this.survey.on( "updateChat", function() {
        var $chat = $(this).find('.survey-chat');
        $chat.scrollTop($chat[0].scrollHeight);
      });

      // Title events.
      this.survey.on( "addTitle", function(e, t) {
        self.survey.find('.survey-title').html('<span>' + t + '</span>');
      });
      this.survey.on( "removeTitle", function(e, t) {
        self.survey.find('.survey-title').html('');
      });

      // Progress events.
      this.survey.on( "addProgress", function(e, v) {
        var surveyProgress = self.survey.find('.survey-progress');
        var progressBar = self.survey.find('.progress-bar', surveyProgress);
        if (surveyProgress.hasClass('disabled')) {
          surveyProgress.removeClass('disabled');
        }
        progressBar.css('width', v+'%').attr('aria-valuenow', v);
      });
      this.survey.on( "removeProgress", function(e, v) {
        var surveyProgress = self.survey.find('.survey-progress');
        if (!surveyProgress.hasClass('disabled')) {
          surveyProgress.addClass('disabled');
        }
      });

      // Message event.
      this.survey.on( "addMessage", function(e, m) {
        var message = Drupal.theme('message', m);
        self.survey.find('.survey-chat').append(message);
        $(this).trigger('updateChat');
      });
  
      // Add result event event.
      this.survey.on( "addResult", function(e, q) {
        var names =  q['question'].type.split(':');
        var mainName = names[0];
        var form = Drupal.theme(mainName, q['question']);
        $(this).find('.survey-chat').append(form);
        form = $(this).find('.survey-chat form').last();
        form.removeClass('active');
        switch (mainName) {
          case 'question_text':
            var message = Drupal.theme('message', {type: 'own', value: q['answer']});
            form.append(message);
            break;

          case 'question_select':
            var option = form.find('label[for^="option-' + q['answer'] + '-"]');
            option.addClass('active');
            break;

          case 'question_datetime':
            form.find('input[type="date"]').val(q['answer']);
            form.find('input').prop('disabled', true);
            form.find('button').prop('disabled', true);
            break
        }
      });

      // Innit question event.
      this.survey.on( "addQuestion", function(e, q) {
        var names = q.type.split(':');
        var mainName = names[0];
        var form = Drupal.theme(mainName, q);
        $(this).find('.survey-chat').append(form);
        $(this).trigger('updateChat');

        switch (q['event']) {
          case 'chatMessage:submit':
            self.survey.on('messageAdded', function (e, val) {
              $(this).off('messageAdded');
              var form = $(this).find('.survey-chat form.active');
              var message = Drupal.theme('message', {type: 'own', value: val});
              form.append(message);
              form.removeClass('active');
              self.data['answer'] = val;
              self.data['qid'] = form.data('qid');
              self.update();
            });
            break;
          case 'select':
            $(this).find('form.active').on('change', function (e) {
              var form = $(this);
              var type = form.data('type');
              form.off('change');
              $(this).removeClass('active');
              self.gettingData(form, type);
              self.data['qid'] = form.data('qid');
              var option = form.find('label[for^="option-' + self.data['answer'] + '-"]');
              option.addClass('active');
              self.update();
            });
            break;

          case 'submit':
            $(this).find('form.active').on('submit', function (e) {
              e.preventDefault();
              var form = $(this);
              var type = form.data('type');
              form.off('change');
              form.removeClass('active');
              self.gettingData(form, type);
              self.data['qid'] = form.data('qid');
              self.update();
            });
            break;
        }
      });
    },

    // Updating survey form after answer.
    update: function () {
      var self = this;
      var type = this.survey.data('type');
      $.ajax({
        url: "pr-questions",
        data: this.data,
        dataType: 'json',
        type: 'POST',
        success: function (events) {
          self.triggerEvents(events);
        }
      });
    },

    // Trigger necessary events.
    triggerEvents: function (events) {
      for (var i = 0; i < events.length; i++) {
        this.survey.trigger( events[i].event, [events[i].data] );
      }
    }
  };
  
  // Template for messages.
  Drupal.theme.message = function (m) {
    return '<div class="chat-message ' + m['type']+ '"><span>' + m['value'] + '</span></div>';
  };

  // Template for text type questions.
  Drupal.theme.question_text = function (question) {
    var form = '';
    form += '<form data-type="question-text" data-qid="' + question.qid + '" class="question-text active">';
    form += '<div class="body">' + question['body'] + '</div>';
    form += '</form>';
    return form;
  };

  // Template for date type questions.
  Drupal.theme.question_datetime = function (question) {
    var form = '';
    form += '<form class="active" data-type="question-datetime" data-qid="' + question.qid + '">';
    form += '<div class="body">' + question['body'] + '</div>';
    form += '<input type="date" name="date">';
    form += '<button type="submit"  class="btn btn-default">';
    form +=   '<span class="glyphicon glyphicon-ok" aria-hidden="true"></span>';
    form += '</button>';
    form += '</form>';
    return form;
  };

  // Template for select type questions.
  Drupal.theme.question_select = function (question) {
    var fields = form = type ='';
    switch (question.type) {
      // Image type.
      case 'question_select:option_image':
        type = 'qs-image';
        fields += '<div class="qs-images">';
        $.each(question.images, function (i, value) {
          var id = 'option-' + i + '-' + makeid();
          $image = '<img src="' + value + '">';
          fields += '<div class="qs-image">';
          fields += '<label for="' + id + '">' + $image + '</label>';
          fields += '<input name="images" type="radio" id="' + id + '" value="fid-' + i + '">';
          fields += '</div>';
        });
        fields += '</div>';
        break;

      // Text list type.
      case 'question_select:option_text':
        type = 'qs-text';
        fields += '<div class="qs-textes">';
        $.each(question.text, function (i, value) {
          var id = 'option-' + i + '-' + makeid();
          fields += '<div class="qs-text">';
          fields += '<label for="' + id + '">' + value + '</label>';
          fields += '<input name="images" type="radio" id="' + id + '"  value="' + i + '">';
          fields += '</div>';
        });
        fields += '</div>';
        break;
    }
    form += '<form data-type="' + type + '" data-qid="' + question.qid + '" class="question-select active">';
    if (typeof question.body != "undefined") {
      form += '<div class="body">' + question['body'] + '</div>';
    }
    form += fields;
    form += '</form>';
    return form;
  };

  // Generating unique string.
  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for ( var i=0; i < 5; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
})(jQuery);