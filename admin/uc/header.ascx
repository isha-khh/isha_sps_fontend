<%@ Control Language="C#" AutoEventWireup="true" CodeFile="header.ascx.cs" Inherits="admin_uc_header" %>

<%--    <script src="<%= ResolveUrl("~/")%>App_Script/jquery.msgbox.min.js"></script>
        <script type="text/javascript">
            function msgbox(text) {
                $.msgbox('<div style="min-width:200px;">' + text + '</div>');
            }
    </script>--%>

    <link href="<%=ResolveUrl("~/App_Script/fontawesome/css/all.min.css") %>" rel="stylesheet" />
 <script src="<%=ResolveUrl("~/App_Script/sweetalert2-9.10.9/dist/sweetalert2.min.js") %>"></script>
    <link href="<%=ResolveUrl("~/App_Script/sweetalert2-9.10.9/dist/sweetalert2.min.css") %>" rel="stylesheet" />
    <script>
        function msgbox(html, icon = '', url = '') {
            Swal.fire({
                icon: icon,
                html: html,
                confirmButtonText: '關閉',
                onClose: () => {
                    if (url != '') {
                        window.location = url;
                    }
                }
            });
        }

        function msgtop(html, icon = 'success') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                heightAuto: false,
                timerProgressBar: true,
                onOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            })

            Toast.fire({
                icon: icon,
                html: '<div class="swal2-toast-cus">' + html + '</div>'
            })
        }

        var mctmp = '0';
        function msgconfirm(html, btn, icon = 'question') {
            if (mctmp == '0') {
                Swal.fire({
                    html: html,
                    icon: icon,
                    showCancelButton: true,
                    confirmButtonText: '<i class="fas fa-check"></i> 確定',
                    cancelButtonText: '<i class="fas fa-times"></i> 取消'
                }).then((result) => {
                    if (result.value) {
                        mctmp = '1';
                        if ($(btn)[0].hasAttribute('href')) {
                            var href = $(btn).attr('href');
                            window.location.href = href;
                        } else {
                            $(btn).click();
                        }
                    }
                })
                mctmp = '0';
                return false;
            } else {
                mctmp = '0';
                return true;
            }
        }
    </script>
    <style>
        .swal2-container > div {
            width: auto;
            min-width: 300px;
            max-width: 95%;
        }

        .swal2-content {
            font-size: 14px;
        }

        .swal2-actions > button {
            font-size: 14px !important;
        }

        .swal2-toast-cus {
            font-size: 20px;
            margin: 20px;
            font-weight: bold;
        }

        p.form-control-static label{
            margin-left:3px;
            margin-right:10px;
        }
      .table-hover td select.form-control{
          width:auto;
          margin:auto;
      }
    </style>