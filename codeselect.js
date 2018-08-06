let current_qset_i = undefined; // index of currently-active question set. TODO: add/remove specific listeners to current questions instead?..
let current_fup_i = undefined;  // same but for 'follow-up' question

// TODO: allow for using one span with several classes, which represents the correct answer to several questions?
// starting point
$( function() {
  // Things in here will execute after the page loads:
  // wrap selectgame element(s) in a table:

  $('.selectgame').wrapInner('<div class="ui two column equal height grid container raised segment"><div class="column textcell" style="overflow:scroll;"></div></div>')
                  // process each selectgame element and add appropriate html:
                  .each(function(){
    // add a table cell to contain the buttons:
    $('.textcell', this).after('<div class="column questioncell" style="overflow:scroll;"></div>');
    questioncell = $(".questioncell", this);
    // for each question class in the question sequence, set up the HTML and behavior for displaying the question:
    for(let qset of questionSequence) {
      let qsetSegment = $('<div class="qseg ui segment" style="display: none;"></div>')
      questioncell.append(qsetSegment)
      for(let qclass of qset) {
        let qtext = questions[qclass].question;
        let qanswer = questions[qclass].answer;
        let qselector = '.'+qclass;
        qsetSegment.append('<div id="'+qclass+'_question" class="ui medium header" style="display: none;">'+qtext+'</div>\
                             <div id="'+qclass+'_answer" style="display: none;">'+qanswer+'</div>');

        // For each element of this particular selector class inside the selectgame class, add the attributes that let it be selected in answer to the question:
        $(qselector, this).each(function(i){
          let el_id = qclass+'_'+i;
          this.setAttribute('id', el_id);
          // TODO: also allow for 'gotcha' elements - relevant to the question, but explicitly the wrong answer.
          // TODO: also handle "AND" style logic: must select each relevant section, rather than just one of.
          // (can implement as 'secret multiple questions': add class part1, part2, etc; each part has its own answer.)
          questions[qclass].ids[el_id] = true;
        });
      }
    }
    for (let i=0; i<followups.length; i++) {
      let fid = 'followup_'+i;
      let fup = followups[i];
      let fSegment = $('<div class="qseg ui form segment" id="'+fid+'" style="display: none;"></div>');
      questioncell.append(fSegment);
      fSegment.append('<div>'+fup.question+'</div>');
      fSegment.append('<div class="field"><input type="text" name="answer" placeholder="answer"></div>\
                       <div class="ui primary submit button">Submit</div>\
                       <div class="ui error message"></div>');
      $('#'+fid).form({
        fields: {
           answer: {
              identifier: 'answer',
              rules: [
                {
                  type   : 'is['+fup.answer+']',
                  prompt : 'That\'s not right, try again!'
                }
              ]
            }
        },
        onSuccess: function(event, fields) {
          // Disable this question:
          $('.field,.submit', event.target).addClass('disabled');
          // Show next question, if any:
          nextFollowup()
        }
       })
    }

    nextQuestionSet()
  });
  // 'Congrats' Modal for when they've finished the questions:
  $('.selectgame').append('\
    <div class="ui modal" id="congrats">\
      <div class="ui header inverted green">Congratulations!</div>\
      <div class="content">\
      You answered all the questions about this problem. You can go back to the previous page to try a differnet problem, or stay on this page to keep studying this one.\
      </div>\
      <div class="actions">\
        <div class="ui green ok button">\
          OK\
        </div>\
      </div>\
    </div>')
});


// helper functions

// TODO: use timeout to make sure they've finished selecting before providing feedback.
document.addEventListener("selectionchange", function() {

  if(current_qset_i >= questionSequence.length) {
    // all question sets completed.
    return;
  }


  foundUnanswered = false; // whether we found any still-unanswered questions in the current set.
  // for each current question, check whether the selection is 'close enough' to the answer.
  for(let q of questionSequence[current_qset_i]) {
    answer_id = q+'_answer';
    answer_el = document.getElementById(answer_id)

    // check whether the new selection answers this current question in the set
    for(let el_id in questions[q].ids) {
      correctness = checkSelection(el_id);
      if(correctness > 0.8) {
        console.log('correct!');
        answer_el.style.display = 'block';
        answer_el.completed = true;
        highlight('#'+answer_id);
      }
    }

    // if this question has not yet been answered, mark that there are some unanswered questions left.
    if(! answer_el.completed) {
      foundUnanswered = true;
    }
  }

  // if all questions in this set have been answered, then advance to next question set.
  if(! foundUnanswered) {
    nextQuestionSet();
    $(".questioncell").each(function(i){
      this.scrollTop = this.scrollHeight
    });
  }
});


// momentarily highlights element in green, then fades to white. TODO: should probably fade to transparent?
// TODO: take in element instead?
function highlight(selector){
    $(selector).css( {
      'background-color': '#aaffaa',
    });
    $(selector).animate({ backgroundColor: '#ffffff' }, 500);
}

function nextQuestionSet() {
  // TODO: throw up a congratulations when they are done.
  // advance question set counter
  if( isNaN(current_qset_i) ) {
      current_qset_i = 0;
  }
  else {
      current_qset_i++;
  }

  //stop highlighting previous question set(s)
  $('.qseg.segment').removeClass('blue raised')
  // show next question set,
  if(current_qset_i < questionSequence.length) {
    for(let q of questionSequence[current_qset_i]) {
      qid = q+'_question'
      $('#'+qid).css({
        display: 'block'
      })
        .parent().css({ // TODO: better/just once per set
          display: 'block'
        }).addClass('blue raised');
    }
  }
  else { // No more text-selection questions - move on to follow up question
    nextFollowup()
  }
}

function nextFollowup() {
  if( isNaN(current_fup_i) ) {
      current_fup_i = 0;
  }
  else {
      current_fup_i++;
  }

  //stop highlighting previous question set(s)
  $('.qseg.segment').removeClass('blue raised')
  if(current_fup_i < followups.length) {
    let fid = 'followup_'+current_fup_i;

    $('#'+fid).css({
      display: 'block'
    }).addClass('blue raised');

  }
  else {
    // All done with questions and follow ups - show congrats modal.
    $('#congrats').modal('show')
  }
}

// TODO: return fraction of correct selected, fraction/length of selected that's incorrect.
function checkSelection(id){
  let correctNode = document.getElementById(id);
  let correctLength = $.trim(correctNode.innerText).length;

  // correctness fraction - 0 is no overlap, 1 is exact correct selection, in between is extra text selected and/or some of the correct text is not selected.
  let correctnessFraction = 0;
  if( getSelection().containsNode(correctNode, true) ) {
    // some overlap between selection and correct node:
    // at least part of the correct selection was selected

    let unselectedStart = 0; // portion of the start of the correct text that wasn't selected
    let unselectedEnd = 0; // portion of the end of the correct text that wasn't selected

    if( correctNode.contains(getSelection().getRangeAt(0).startContainer) ) {
      // selection start overlaps correct text; in other words, the start of the correct text is not selected
      console.log("start  overlaps");

      // calculate length of correct text (at start) NOT overlapping selection:
      let unselectedStartNodes = document.createRange();
      unselectedStartNodes.setStart( correctNode, 0 );
      unselectedStartNodes.setEnd( getSelection().getRangeAt(0).startContainer, getSelection().getRangeAt(0).startOffset);

      console.log(unselectedStartNodes.toString());

      unselectedStart = $.trim(unselectedStartNodes.toString()).length;
      // Note: because I'm trimming the whitespace, I think whitespace "adjacent" to the selection doesn't count toward totalLength. Oh well.
    }

    if( correctNode.contains(getSelection().getRangeAt(0).endContainer) ) {
      // selection end overlaps correct text; in other words, the end of the correct text is not selected
      console.log("end overlaps");

      // calculate length of correct text (at end) NOT overlapping selection:
      let unselectedEndNodes = document.createRange();
      unselectedEndNodes.setStart( getSelection().getRangeAt(0).endContainer, getSelection().getRangeAt(0).endOffset);
      unselectedEndNodes.setEnd( correctNode, correctNode.childNodes.length );
      console.log(unselectedEndNodes.toString());

      unselectedEnd = $.trim(unselectedEndNodes.toString()).length;
      // Note: because I'm trimming the whitespace, I think whitespace "adjacent" to the selection doesn't count toward totalLength. Oh well.
    }
    // calculate total length of "relevant" text (selected OR part of the correct text):
    let totalLength = getSelection().toString().length + unselectedStart + unselectedEnd;
    //calculate total length of "valid" text (selected AND part of the correct text):
    let validSelectionLength = correctLength - unselectedStart - unselectedEnd;

    correctnessFraction = validSelectionLength/totalLength;
  }
  return correctnessFraction
  //document.getElementById('result_'+id).textContent = correctnessFraction;
}
