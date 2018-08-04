
// data
let questions = {
  'signature': {
    'question': 'What is the signature of the function you have to write?',
    'answer': '<pre>def solution(S, A)</pre>',
    'ids': {} // ids of elements in the text that are relevant to this question (auto-populated from HTML)
  },
  'param1': {
    'question': 'What are the input parameters?',
    'answer': 'S',
    'ids': {}
  },
  'param2': {
    'question': '', // TODO: less hacky way of having question groups with just one question string. lightweight data structure in questionSequence?
    'answer': 'A',
    'ids': {}
  },
  'sType': {
    'question': 'What data type is S?',
    'answer': 'string',
    'ids': {}
  },
  'aType': {
    'question': 'What data type is A?',
    'answer': 'array of strings',
    'ids': {}
  },
  'sRepresents': {
    'question': 'What does S represent?',
    'answer': 'A template string to "match" against other strings.',
    'ids': {}
  },
  'aRepresents': {
    'question': 'What each element of A represent?',
    'answer': 'A string which might "match" the template string',
    'ids': {}
  },
  'matchMeaning': {
    'question': 'What does <em>match</em> mean in the context of this problem?',
    'answer': 'A template <em>matches</em> a string if each letter in the template is the same as the corresponding letter in the string; each "_" in the template can be any letter in the string',
    'ids': {}
  },
  'sConstraints': {
      'question': 'What types of characters can be in S?',
      'answer': 'Letters and underscores',
      'ids': {}
  },
  'aConstraints': {
      'question': 'What types of characters can be in each element of A?',
      'answer': 'Only letters',
      'ids': {}
  },
  // TODO: what can S and A[K] consist of?
  'output': {
    'question': 'What should our function output?',
    'answer': 'The number of strings in A which match the template',
    'ids': {}
  },
  'example1': { // TODO: separate question for expected output
    'question': 'What is the provided input/output example?',
    'answer': 'S = "b__t" <br/>A = ["boat", "bat", "boot", "bite"] <br/>expected output: "2"',
    'ids': {}
  }
};

/*
Check-understanding:
Given this input, what should the function output?
*/

// TODO: help button that highlights an answer option?

// TODO: optional and/or subsumed questions? (e.g. "non-empty" and "contains at least one alphanumeric character")

let questionSequence = [
  ['signature'],
  ['param1', 'param2'],
  ['sType', 'aType'],
  ['sRepresents', 'aRepresents'],
  ['matchMeaning'],
  ['sConstraints','aConstraints'],
  ['output'],
  ['example1']
];

let current_qset_i = undefined; // index of currently-active question set. TODO: add/remove specific listeners to current questions instead?..

// TODO: allow for using one span with several classes, which represents the correct answer to several questions?
// starting point
$( function() {
  // Things in here will execute after the page loads:

  // Immediately give up and use tables.
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
    nextQuestionSet()
  });
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
