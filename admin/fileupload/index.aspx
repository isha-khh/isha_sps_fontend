<%@ Page Language="C#" AutoEventWireup="true" CodeFile="index.aspx.cs" Inherits="admin_fileupload_index" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title></title>

    <script src="../../App_Script/jquery-1.12.4.min.js"></script>
    <link href="../filemanager/admin.css" rel="stylesheet" />
    <style type="text/css">
        body{
            padding:10px;
        }
    </style>
    <script type="text/javascript">

        filelist='';

        function OpenFile(fileUrl) {
            tmp=fileUrl.split(',');
            fileUrl='';
            for (i=0;i<tmp.length;i++){
                fileUrl+=(fileUrl!=''?'\n':'') + '<%=defPath%>' + tmp[i].replace(/ /g, "_");
            }           
            window.opener.CKEDITOR.tools.callFunction(<%= Convert.ToString(Request["CKEditorFuncNum"]) %>, fileUrl);
               //window.opener.SetUrl(fileUrl);
               window.close();
               window.opener.focus();
           }   
    </script>
	
</head>
<body>
    <form id="form1" runat="server">

        <div id="swfu_container" style="margin: 0px 10px;">


        <asp:MultiView ID="MultiView1" runat="server" ActiveViewIndex="0">
            <asp:View ID="View1" runat="server">

                	<script type="text/javascript" src="../../App_Script/swfupload/swfupload.js"></script>

    
    <script type="text/javascript">
        var swfu;
        window.onload = function () {
            swfu = new SWFUpload({
                // Backend Settings
                upload_url: "upload.aspx?dirname=images",
                post_params: {
                    "ASPSESSID": "1"
                },

                // File Upload Settings
                file_size_limit: "4 MB",
                file_types: "*.jpg",
                file_types_description: "JPG Images",
                file_upload_limit: "0",    // Zero means unlimited

                // Event Handler Settings - these functions as defined in Handlers.js
                //  The handlers are not part of SWFUpload but are part of my website and control how
                //  my website reacts to the SWFUpload events.
                file_queue_error_handler: fileQueueError,
                file_dialog_complete_handler: fileDialogComplete,
                upload_progress_handler: uploadProgress,
                upload_error_handler: uploadError,
                upload_success_handler: uploadSuccess,
                upload_complete_handler: uploadComplete,

                // Button settings
                button_image_url: "../../App_Script/swfupload/images/XPButtonNoText_160x22.png",
                button_placeholder_id: "spanButtonPlaceholder",
                button_width: 160,
                button_height: 22,
                button_text: '<span class="button">請選擇要上傳的相片</span>',
                button_text_style: '.button { font-family: Helvetica, Arial, sans-serif; font-size: 14pt; } .buttonSmall { font-size: 10pt; }',
                button_text_top_padding: 1,
                button_text_left_padding: 5,

                // Flash Settings
                flash_url: "../../App_Script/swfupload/swfupload.swf", // Relative to this file

                custom_settings: {
                    upload_target: "divFileProgressContainer"
                },

                // Debug Settings
                debug: false
            });

                                  
        }
             

	</script>

    <script type="text/javascript">

        

        function fileQueueError(file, errorCode, message) {
            try {
                var imageName = "error.gif";
                var errorName = "";
                if (errorCode === SWFUpload.errorCode_QUEUE_LIMIT_EXCEEDED) {
                    errorName = "您上傳太多的檔案";
                }

                if (errorName !== "") {
                    alert(errorName);
                    return;
                }

                switch (errorCode) {
                    case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
                        imageName = "zerobyte.gif";
                        break;
                    case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
                        imageName = "toobig.gif";
                        break;
                    case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
                    case SWFUpload.QUEUE_ERROR.INVALID_FILETYPE:
                    default:
                        alert(message);
                        break;
                }

                addImage("../../App_Script/swfupload/images/" + imageName);

            } catch (ex) {
                this.debug(ex);
            }

        }

        function fileDialogComplete(numFilesSelected, numFilesQueued) {
            try {
                if (numFilesQueued > 0) {
                    this.startUpload();
                }
            } catch (ex) {
                this.debug(ex);
            }
        }

        function uploadProgress(file, bytesLoaded) {

            try {
                var percent = Math.ceil((bytesLoaded / file.size) * 100);

                var progress = new FileProgress(file,  this.customSettings.upload_target);
                progress.setProgress(percent);
                if (percent === 100) {
                    progress.setStatus("上傳中,請稍候...");
                    progress.toggleCancel(false, this);
                } else {
                    progress.setStatus("上傳中,請稍候...");
                    progress.toggleCancel(true, this);
                }
            } catch (ex) {
                this.debug(ex);
            }
        }

        function uploadSuccess(file, serverData) {
            try {
                //addImage("ShowThumbnail.aspx?id=" + serverData);

                var progress = new FileProgress(file,  this.customSettings.upload_target);
                filelist+=(filelist!=""?",":"") + file.name;
                progress.setStatus("Thumbnail Created.");
                progress.toggleCancel(false);


            } catch (ex) {
                this.debug(ex);
            }
        }

        function uploadComplete(file) {
            try {
                /*  I want the next upload to continue automatically so I'll call startUpload here */
                if (this.getStats().files_queued > 0) {
                    this.startUpload();
                } else {
                    var progress = new FileProgress(file,  this.customSettings.upload_target);
                    progress.setComplete();
                    progress.setStatus("您所選擇的檔案皆已上傳");
                    OpenFile(filelist);
                    progress.toggleCancel(false);
                }
            } catch (ex) {
                this.debug(ex);
            }
        }

        function uploadError(file, errorCode, message) {
            var imageName =  "error.gif";
            var progress;
            try {
                switch (errorCode) {
                    case SWFUpload.UPLOAD_ERROR.FILE_CANCELLED:
                        try {
                            progress = new FileProgress(file,  this.customSettings.upload_target);
                            progress.setCancelled();
                            progress.setStatus("Cancelled");
                            progress.toggleCancel(false);
                        }
                        catch (ex1) {
                            this.debug(ex1);
                        }
                        break;
                    case SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED:
                        try {
                            progress = new FileProgress(file,  this.customSettings.upload_target);
                            progress.setCancelled();
                            progress.setStatus("Stopped");
                            progress.toggleCancel(true);
                        }
                        catch (ex2) {
                            this.debug(ex2);
                        }
                    case SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED:
                        imageName = "uploadlimit.gif";
                        break;
                    default:
                        alert(message);
                        break;
                }

                addImage("../../App_Script/swfupload/images/" + imageName);

            } catch (ex3) {
                this.debug(ex3);
            }

        }


        function addImage(src) {
            var newImg = document.createElement("img");
            newImg.style.margin = "5px";

            document.getElementById("thumbnails").appendChild(newImg);
            if (newImg.filters) {
                try {
                    newImg.filters.item("DXImageTransform.Microsoft.Alpha").opacity = 0;
                } catch (e) {
                    // If it is not set initially, the browser will throw an error.  This will set it if it is not set yet.
                    newImg.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + 0 + ')';
                }
            } else {
                newImg.style.opacity = 0;
            }

            newImg.onload = function () {
                fadeIn(newImg, 0);
            };
            newImg.src = src;
        }

        function fadeIn(element, opacity) {
            var reduceOpacityBy = 5;
            var rate = 30;	// 15 fps


            if (opacity < 100) {
                opacity += reduceOpacityBy;
                if (opacity > 100) {
                    opacity = 100;
                }

                if (element.filters) {
                    try {
                        element.filters.item("DXImageTransform.Microsoft.Alpha").opacity = opacity;
                    } catch (e) {
                        // If it is not set initially, the browser will throw an error.  This will set it if it is not set yet.
                        element.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + opacity + ')';
                    }
                } else {
                    element.style.opacity = opacity / 100;
                }
            }

            if (opacity < 100) {
                setTimeout(function () {
                    fadeIn(element, opacity);
                }, rate);
            }
        }



        /* ******************************************
         *	FileProgress Object
         *	Control object for displaying file info
         * ****************************************** */

        function FileProgress(file, targetID) {
            this.fileProgressID = "divFileProgress";

            this.fileProgressWrapper = document.getElementById(this.fileProgressID);
            if (!this.fileProgressWrapper) {
                this.fileProgressWrapper = document.createElement("div");
                this.fileProgressWrapper.className = "progressWrapper";
                this.fileProgressWrapper.id = this.fileProgressID;

                this.fileProgressElement = document.createElement("div");
                this.fileProgressElement.className = "progressContainer";

                var progressCancel = document.createElement("a");
                progressCancel.className = "progressCancel";
                progressCancel.href = "#";
                progressCancel.style.visibility = "hidden";
                progressCancel.appendChild(document.createTextNode(" "));

                var progressText = document.createElement("div");
                progressText.className = "progressName";
                progressText.appendChild(document.createTextNode(file.name));

                var progressBar = document.createElement("div");
                progressBar.className = "progressBarInProgress";

                var progressStatus = document.createElement("div");
                progressStatus.className = "progressBarStatus";
                progressStatus.innerHTML = "&nbsp;";

                this.fileProgressElement.appendChild(progressCancel);
                this.fileProgressElement.appendChild(progressText);
                this.fileProgressElement.appendChild(progressStatus);
                this.fileProgressElement.appendChild(progressBar);

                this.fileProgressWrapper.appendChild(this.fileProgressElement);

                document.getElementById(targetID).appendChild(this.fileProgressWrapper);
                fadeIn(this.fileProgressWrapper, 0);

            } else {
                this.fileProgressElement = this.fileProgressWrapper.firstChild;
                this.fileProgressElement.childNodes[1].firstChild.nodeValue = file.name;
            }

            this.height = this.fileProgressWrapper.offsetHeight;

        }
        FileProgress.prototype.setProgress = function (percentage) {
            this.fileProgressElement.className = "progressContainer green";
            this.fileProgressElement.childNodes[3].className = "progressBarInProgress";
            this.fileProgressElement.childNodes[3].style.width = percentage + "%";
        };
        FileProgress.prototype.setComplete = function () {
            this.fileProgressElement.className = "progressContainer blue";
            this.fileProgressElement.childNodes[3].className = "progressBarComplete";
            this.fileProgressElement.childNodes[3].style.width = "";

        };
        FileProgress.prototype.setError = function () {
            this.fileProgressElement.className = "progressContainer red";
            this.fileProgressElement.childNodes[3].className = "progressBarError";
            this.fileProgressElement.childNodes[3].style.width = "";

        };
        FileProgress.prototype.setCancelled = function () {
            this.fileProgressElement.className = "progressContainer";
            this.fileProgressElement.childNodes[3].className = "progressBarError";
            this.fileProgressElement.childNodes[3].style.width = "";

        };
        FileProgress.prototype.setStatus = function (status) {
            this.fileProgressElement.childNodes[2].innerHTML = status;
        };

        FileProgress.prototype.toggleCancel = function (show, swfuploadInstance) {
            this.fileProgressElement.childNodes[0].style.visibility = show ? "visible" : "hidden";
            if (swfuploadInstance) {
                var fileID = this.fileProgressID;
                this.fileProgressElement.childNodes[0].onclick = function () {
                    swfuploadInstance.cancelUpload(fileID);
                    return false;
                };
            }
        };

    </script>

                  
		    <div>
				<span id="spanButtonPlaceholder"></span>
		    </div>
		
            </asp:View>
            <asp:View ID="View2" runat="server">



 <link href="../../App_Script/jquery-upload-file-master/css/uploadfile.css" rel="stylesheet" />
<script src="../../App_Script/jquery-upload-file-master/js/jquery.uploadfile.js"></script>

                   <div id="fileuploader">請選擇要上傳的檔案</div>
                <script>
                    $(document).ready(function()
                    {
                        $("#fileuploader").uploadFile({
                            url:"upload.aspx?dirname=images",
                            fileName:"Filedata",
                            acceptFiles:"image/*",
                            uploadFolder:"images",
                            onSuccess: function (files, response, xhr, pd) {
                                filelist+=(filelist!=""?",":"") + files;
                            },
                            afterUploadAll:function()
                            {
                                $("#divFileProgressContainer").html("<div style='padding-top:10px'>您所選擇的檔案皆已上傳</div>");	
                                OpenFile(filelist);
                            }
                        });
                                               
                     
                    });
            </script>
             
            </asp:View>
        </asp:MultiView>


                <div id="divFileProgressContainer" style="height: 75px;"></div>
		    <div id="thumbnails"></div>
	    </div>



    </form>
</body>
</html>
