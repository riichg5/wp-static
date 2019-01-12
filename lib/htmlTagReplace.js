
/**
	处理类似标签
	<div class="a">
		xxxxx
		<div><div></div></div>
	</div>
*/
function getTagInfo (tag) {
	tag = tag.trim();
	tag = tag.replace(/</g, "").replace(/>/g, "");
	let tagName = tag.split(' ')[0];

	let info = {
		tagName: `<${tagName}`,
		endTagName: `</${tagName}>`
	};

	return info;
}



function replace ({html, tag, position, repalceHtml}) {
        let tagIndex = html.startOf(tag);
        let count = 0;

        while (tagIndex !== -1) {
            //position为null，表示全替换
            if(position === null || position === count) {
                let tagInfo = getTagInfo(tag);

                let nextTagIndex = html.startOf(tagInfo.tagName, tagIndex + 1);
                let nextEndTagIndex = html.startOf(tagInfo.endTagName, tagIndex + 1);
                while(nextTagIndex !== -1 || nextEndTagIndex > nextTagIndex) {

                }
            }

            if(position !== null && position === count) {
                break;
            }

            count++;
            tagIndex = html.startOf(tag, tagIndex + 1);
        }


    }

module.exports = replace();